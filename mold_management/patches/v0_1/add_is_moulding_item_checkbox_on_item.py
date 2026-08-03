import frappe


def execute():
    # Check if field already exists
    if not frappe.db.exists("Custom Field", "Item-is_moulding"):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "is_moulding",
            "label": "Is Moulding",
            "fieldtype": "Check",
            "insert_after": "is_mould_item"
        }).insert()
