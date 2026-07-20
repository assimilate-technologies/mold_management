import frappe

def execute():
    """Add custom field `belongs_to` to Tool Room Work Order Operation doctype"""
    if frappe.db.exists("Custom Field", {"dt": "Tool Room Work Order Operation", "fieldname": "belongs_to"}):
        return
    frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "Tool Room Work Order Operation",
        "fieldname": "belongs_to",
        "label": "Belongs To",
        "fieldtype": "Select",
        "options": "\nMould\nMoulding",
        "insert_after": "workstation",
    }).insert()
