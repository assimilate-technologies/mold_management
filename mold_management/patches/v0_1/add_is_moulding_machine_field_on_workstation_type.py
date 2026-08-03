import frappe


def execute():
    """Add custom field `is_moulding_machine` to Workstation Type doctype"""
    if frappe.db.exists("Custom Field", {"dt": "Workstation Type", "fieldname": "is_moulding_machine"}):
        return
    frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "Workstation Type",
        "fieldname": "is_moulding_machine",
        "label": "Is Moulding Machine",
        "fieldtype": "Check",
        "insert_after": "hour_rate",
    }).insert()
