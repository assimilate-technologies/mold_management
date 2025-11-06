import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    fieldname = "rejected_qty"
    doctype = "Job Card Time Log"

    # check if field already exists
    if not frappe.db.exists("Custom Field", f"{doctype}-{fieldname}"):
        print(f"Creating custom field {fieldname} in {doctype}")
        create_custom_field(doctype, {
            "fieldname": fieldname,
            "label": "Rejected Qty",
            "fieldtype": "Float",
            "insert_after": "completed_qty",  # adjust as needed
            "reqd": 0
        })
    else:
        print(f"Field {fieldname} already exists in {doctype}, skipping.")
