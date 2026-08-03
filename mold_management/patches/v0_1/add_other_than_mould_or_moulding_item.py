import frappe


def execute():
    # Check if field already exists
    if not frappe.db.exists("Custom Field", "Item-other_than_mould_or_moulding"):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "other_than_mould_or_moulding",
            "label": "Other than Mould/Moulding",
            "fieldtype": "Check",
            "insert_after": "is_moulding"
        }).insert()
