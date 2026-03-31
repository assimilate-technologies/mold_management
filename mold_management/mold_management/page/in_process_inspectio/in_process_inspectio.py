import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist()
def get_report_data(reference_name=None, quality_inspection_template=None):
    if not reference_name:
        # Get the latest Job Card as default
        latest_jc = frappe.db.get_value("Job Card", {"docstatus": ["<", 2]}, "name", order_by="creation desc")
        if not latest_jc:
            return []
        reference_name = latest_jc

    # Identify if it's a Job Card, Work Order, or Daily Production Log
    is_jc = frappe.db.exists("Job Card", reference_name)
    is_wo = frappe.db.exists("Work Order", reference_name)
    is_dpl = frappe.db.exists("Daily Production Log", reference_name)

    job_cards = []
    work_order = None

    if is_jc:
        jc = frappe.get_doc("Job Card", reference_name)
        job_cards = [jc]
        if jc.work_order:
            work_order = frappe.get_doc("Work Order", jc.work_order)
    elif is_wo:
        work_order = frappe.get_doc("Work Order", reference_name)
        job_cards = frappe.get_all("Job Card", 
            filters={"work_order": reference_name, "docstatus": ["<", 2]},
            fields=["*"]
        )
    elif is_dpl:
        dpl = frappe.get_doc("Daily Production Log", reference_name)
        if dpl.job_card:
            jc = frappe.get_doc("Job Card", dpl.job_card)
            job_cards = [jc]
            if jc.work_order:
                work_order = frappe.get_doc("Work Order", jc.work_order)

    if not job_cards:
        return []

    report_data = []
    for jc_data in job_cards:
        # Convert to Document if it's a dictionary from get_all
        jc = frappe.get_doc("Job Card", jc_data.name) if isinstance(jc_data, dict) else jc_data
        sheet = build_sheet_data(jc, work_order, quality_inspection_template)
        report_data.append(sheet)

    return report_data

def build_sheet_data(jc, wo, custom_template=None):
    item = frappe.get_doc("Item", jc.production_item)
    
    # Fetch Quality Inspections linked to this Job Card
    # Map them to time slots
    inspections = frappe.get_all("Quality Inspection",
        filters={"reference_name": jc.name, "docstatus": ["<", 2], "inspection_type": ["in", ["In Process", "FPA", "LPA", "Final"]]},
        fields=["name", "report_date", "inspected_by", "time_slot", "inspection_type", "quality_inspection_template"],
        order_by="time_slot asc"
    )

    qi_template = inspections[0].quality_inspection_template if inspections and inspections[0].get("quality_inspection_template") else None
    
    # Fetch Template
    template_name = custom_template or qi_template or jc.get("quality_inspection_template") or item.get("in_process_inspection_template") or item.get("quality_inspection_template")
    parameters = []
    if template_name:
        parameters = frappe.get_all("Item Quality Inspection Parameter",
            filters={"parent": template_name},
            fields=["*"],
            order_by="idx"
        )

    for qi in inspections:
        qi.readings = frappe.get_all("Quality Inspection Reading",
            filters={"parent": qi.name},
            fields=["*"]
        )

    # Header Data
    operator = ""
    if jc.get("employees") and len(jc.employees) > 0:
        operator = jc.employees[0].employee_name
    elif jc.get("operator"):
        operator = frappe.db.get_value("Employee", jc.operator, "employee_name") or jc.operator

    # Try to find batch from Daily Production Logs if not on Job Card
    batch_no = jc.batch_no
    if not batch_no:
        batch_no = frappe.db.get_value("Daily Production Log", {"job_card": jc.name}, "batch_no")

    # Shift Fallback
    shift = jc.get("custom_shift") or jc.get("shift")
    if not shift and wo:
        shift = wo.get("custom_shift") or wo.get("shift")

    return {
        "job_card": {
            "name": jc.name,
            "production_item": jc.production_item,
            "mould": jc.mould,
            "batch_no": batch_no,
            "workstation": jc.workstation,
            "shift": shift,
            "work_order": jc.work_order
        },
        "item": {
            "item_name": item.item_name,
            "model": item.get("model"),
            "raw_material": item.get("raw_material"),
            "masterbatch": item.get("masterbatch"),
            "rev_no": item.get("rev_no"),
            "page_no": item.get("page_no")
        },
        "template_name": template_name,
        "parameters": parameters,
        "inspections": inspections,
        "operator": operator,
        "today": nowdate()
    }
