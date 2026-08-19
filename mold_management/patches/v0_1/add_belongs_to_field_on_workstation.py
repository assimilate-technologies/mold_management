import frappe

def execute():
    """Add custom field `belongs_to` to Workstation doctype"""
    if frappe.db.exists("Custom Field", {"dt": "Workstation", "fieldname": "belongs_to"}):
        return
    frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "Workstation",
        "fieldname": "belongs_to",
        "label": "Belongs To",
        "fieldtype": "Select",
        "options": "\nMould\nMoulding",
        "insert_after": "disabled",
    }).insert()
