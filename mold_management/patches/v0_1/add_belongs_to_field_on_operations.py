import frappe

def execute():
    """Add custom field `belongs_to` to Operation doctype"""
    if frappe.db.exists("Custom Field", {"dt": "Operation", "fieldname": "belongs_to"}):
        return
    frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "Operation",
        "fieldname": "belongs_to",
        "label": "Belongs To",
        "fieldtype": "Select",
        "options": "\nMould\nMoulding",
        "insert_after": "workstation",
    }).insert()
