import frappe
from frappe import _
from frappe.utils import flt, nowdate


@frappe.whitelist()
def add_production_log_entry(job_card, time_slot, ok_shots, rej_shots, operator=None, rej_code=None, remarks=None):
    if not job_card:
        frappe.throw(_("Job Card is required"))

    jc = frappe.get_doc("Job Card", job_card)
    today = nowdate()

    # Resilience: Check for mold vs mould field names
    dpl_meta = frappe.get_meta("Daily Production Log")
    mould_field = "mould" if dpl_meta.has_field("mould") else "mold"

    # Try to find an existing Daily Production Log for this Job Card and Date
    log_name = frappe.db.get_value("Daily Production Log", {
        "job_card": job_card,
        "report_date": today,
        "docstatus": ["<", 2]
    }, "name")

    if log_name:
        dpl = frappe.get_doc("Daily Production Log", log_name)
    else:
        # Create new Daily Production Log
        dpl = frappe.new_doc("Daily Production Log")
        dpl.job_card = job_card
        dpl.doc_no = job_card
        dpl.company = jc.company
        dpl.item_code = jc.production_item
        dpl.report_date = today
        dpl.machine_no = jc.workstation
        dpl.operator = operator or jc.get("operator") or jc.get("employee")

        # Handle employee field which could be Table MultiSelect or Link
        if not dpl.operator and hasattr(jc, "employee"):
             dpl.operator = jc.employee[0].employee if isinstance(jc.employee, list) and len(jc.employee) > 0 else jc.employee

        if dpl.operator:
            dpl.operator_name = frappe.db.get_value("Employee", dpl.operator, "employee_name")

        mould_val = jc.get("mould") or jc.get("mold")
        dpl.set(mould_field, mould_val)

        # Fetch Quality Inspection if exists for this Job Card
        qi = frappe.db.get_value("Quality Inspection", {"reference_name": job_card, "docstatus": ["<", 2]}, "name")
        if qi:
            dpl.quality_inspection = qi
            dpl.shift = frappe.db.get_value("Quality Inspection", qi, "custom_shift")

        # Fetch Item details
        item = frappe.get_doc("Item", jc.production_item)
        dpl.product_name = item.item_name
        dpl.shot_weight = item.get("shot_wt")
        dpl.runner_weight = item.get("runner_wt")
        dpl.cycle_time = item.get("cycle_time")
        dpl.shift_target = item.get("shift_prod")
        dpl.rev_no = item.get("rev_no")
        dpl.page_no = item.get("page_no")
        dpl.anti_static = item.get("anti_static")

        if dpl.shift_target:
            shift_hours = frappe.db.get_single_value("Manufacturing Settings", "moulding_shift_hours") or 12
            dpl.hourly_target = flt(dpl.shift_target) / flt(shift_hours)

        # Fetch Mould details
        if mould_val:
            mould_doc = frappe.get_doc("Mould", mould_val)
            dpl.total_cavity = mould_doc.get("cavity_count")
            dpl.running_cavity = mould_doc.get("cavity_count")
            if not dpl.shot_weight:
                dpl.shot_weight = mould_doc.get("shot_weight")
            if not dpl.runner_weight:
                dpl.runner_weight = mould_doc.get("runner_weight")
            dpl.total_shots = mould_doc.get("total_shots")

        # Raw Material and Masterbatch fallback mapping
        dpl.raw_material = item.get("raw_material")
        dpl.raw_material_grade = item.get("raw_material_grade")
        dpl.masterbatch = item.get("masterbatch")
        dpl.masterbatch_grade = item.get("masterbatch_grade")

        # Try to fetch raw materials from Job Card items
        if jc.items:
            for rm in jc.items:
                if "MASTERBATCH" in rm.item_name.upper():
                    if not dpl.masterbatch:
                        dpl.masterbatch = rm.item_code
                else:
                    if not dpl.raw_material:
                        dpl.raw_material = rm.item_code

        # Fetch Batch from Job Card main if available
        dpl.raw_material_batch_no = jc.get("batch_no")

        # Fetch First Counter from Last Log
        # Use try-except because even if meta has 'mould', the DB column might be missing until migration
        try:
            last_log = frappe.get_all("Daily Production Log",
                filters={mould_field: mould_val, "machine_no": dpl.machine_no},
                order_by="creation desc", limit=1)
            if last_log:
                dpl.first_counter = frappe.db.get_value("Daily Production Log", last_log[0].name, "last_counter")
        except Exception:
            # Fallback to 'mold' if 'mould' fails, or vice versa
            alt_field = "mold" if mould_field == "mould" else "mould"
            try:
                last_log = frappe.get_all("Daily Production Log",
                    filters={alt_field: mould_val, "machine_no": dpl.machine_no},
                    order_by="creation desc", limit=1)
                if last_log:
                    dpl.first_counter = frappe.db.get_value("Daily Production Log", last_log[0].name, "last_counter")
            except Exception:
                frappe.log_error(frappe.get_traceback(), "production_log_fetch_first_counter")

        dpl.insert()

    # Add entry to child table
    prev_total = 0
    if dpl.production_data:
        prev_total = flt(dpl.production_data[-1].total_shots)

    current_total = prev_total + flt(ok_shots) + flt(rej_shots)

    dpl.append("production_data", {
        "time_slot": time_slot,
        "ok_shots": flt(ok_shots),
        "rej_shots": flt(rej_shots),
        "total_shots": current_total,
        "rej_code": rej_code,
        "remarks": remarks
    })

    # Update cumulative totals in parent
    update_totals(dpl)
    dpl.save()

    return dpl.name

def update_totals(dpl):
    total_ok = 0
    total_rej = 0
    for row in dpl.production_data:
        total_ok += flt(row.ok_shots)
        total_rej += flt(row.rej_shots)

    dpl.total_ok_shots = total_ok
    dpl.total_rej_shots = total_rej

    # Update last_counter
    dpl.last_counter = flt(dpl.first_counter or 0) + total_ok + total_rej

    # RM Consumption calculation (weights are in kg per the field labels)
    if dpl.get("shot_weight") or dpl.get("runner_weight"):
        s_wt = flt(dpl.get("shot_weight"))
        r_wt = flt(dpl.get("runner_weight"))
        dpl.rm_consumption = (s_wt + r_wt) * (total_ok + total_rej)

@frappe.whitelist()
def get_job_cards_for_work_order(work_order):
    return frappe.get_all("Job Card", filters={"work_order": work_order, "docstatus": ["<", 2]}, fields=["name", "operation", "workstation"])
