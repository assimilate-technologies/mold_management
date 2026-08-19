import frappe

def execute():
    # Check if field already exists
    if not frappe.db.exists("Custom Field", "Item-is_mould_item"):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "is_mould_item",
            "label": "Is Mould",
            "fieldtype": "Check",
            "insert_after": "standard_rate"
        }).insert()
