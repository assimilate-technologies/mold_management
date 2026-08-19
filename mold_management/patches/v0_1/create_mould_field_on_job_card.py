import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    # Skip if field already exists
    if frappe.db.exists("Custom Field", "Job Card-mould"):
        return

    field = {
        "fieldname": "mould",
        "label": "Mould",
        "fieldtype": "Link",
        "options": "Mould",
        "insert_after": "employee"
    }

    create_custom_field("Job Card", field, ignore_validate=True)

    frappe.db.commit()
    frappe.clear_cache(doctype="Job Card")
