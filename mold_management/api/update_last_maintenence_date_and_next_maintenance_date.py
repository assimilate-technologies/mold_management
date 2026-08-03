import frappe
from frappe.model.document import Document


class MouldMaintenance(Document):

    def on_save(self):
        update_mould_dates_from_maintenance(self)


def update_mould_dates_from_maintenance(doc):
    """
    Compute Last Maintenance Date & Next Maintenance Due
    from Mould Maintenance child table and update the related Mould.
    """

    mould = doc.get("mould_name")
    if not mould:
        return

    last_dates = []
    next_dates = []

    for row in (doc.get("mould_maintenance_tasks") or []):
        end_date = row.get("end_date")
        last_completion = row.get("last_completion_date")
        start_date = row.get("start_date")
        periodicity = row.get("periodicity")
        row_name = row.get("name")

        # --- Auto-fix last_completion_date from end_date ---
        if end_date and not last_completion:
            try:
                frappe.db.set_value("Mould Maintenance Task", row_name, "last_completion_date", end_date)
                last_completion = end_date
            except Exception:
                frappe.log_error(frappe.get_traceback(), "update_mould_dates")

        # --- Compute next_due_date ---
        base = last_completion or end_date or start_date
        computed_next = None

        if base and periodicity:
            try:
                p = periodicity.strip()

                if p == "Daily":
                    computed_next = frappe.utils.add_to_date(base, days=1)
                elif p == "Weekly":
                    computed_next = frappe.utils.add_to_date(base, days=7)
                elif p == "Monthly":
                    computed_next = frappe.utils.add_to_date(base, months=1)
                elif p == "Quarterly":
                    computed_next = frappe.utils.add_to_date(base, months=3)
                elif p.lower() in ("half-yearly", "half yearly"):
                    computed_next = frappe.utils.add_to_date(base, months=6)
                elif p == "Yearly":
                    computed_next = frappe.utils.add_to_date(base, years=1)
                elif p == "2 Yearly":
                    computed_next = frappe.utils.add_to_date(base, years=2)
                elif p == "3 Yearly":
                    computed_next = frappe.utils.add_to_date(base, years=3)

            except Exception:
                frappe.log_error(frappe.get_traceback(), "update_mould_dates")
                computed_next = None

        existing_next = row.get("next_due_date")

        if computed_next and (not existing_next or str(existing_next) != str(computed_next)):
            try:
                frappe.db.set_value("Mould Maintenance Task", row_name, "next_due_date", computed_next)
                existing_next = computed_next
            except Exception:
                frappe.log_error(frappe.get_traceback(), "update_mould_dates")

        # --- Collect next dates >= today ---
        if existing_next:
            try:
                nd_dt = frappe.utils.getdate(existing_next)
                if nd_dt >= frappe.utils.getdate(frappe.utils.today()):
                    next_dates.append(nd_dt)
            except Exception:
                frappe.log_error(frappe.get_traceback(), "update_mould_dates")

        # --- Collect last completion date ---
        chosen_last = last_completion or end_date
        if chosen_last:
            try:
                last_dates.append(frappe.utils.getdate(chosen_last))
            except Exception:
                frappe.log_error(frappe.get_traceback(), "update_mould_dates")

    # --- Prepare final mould values ---
    values = {}
    if last_dates:
        values["last_maintenance_date"] = max(last_dates)

    if next_dates:
        values["next_maintenance_due"] = min(next_dates)

    # --- Update Mould ---
    if values:
        try:
            frappe.db.set_value("Mould", mould, values, update_modified=False)
        except Exception:
            frappe.log_error(
                f"Failed updating Mould {mould} with {values}",
                "mould_maintenance_to_mould_update"
            )
