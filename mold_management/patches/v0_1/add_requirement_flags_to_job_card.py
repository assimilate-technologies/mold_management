import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    # Update 'mould' field on Job Card to be insert_after workstation if possible
    # and ensure workstation exists (it should be standard field)
    
    # 1. Add is_workstation_required to Job Card
    if not frappe.db.exists("Custom Field", "Job Card-is_workstation_required"):
        field = {
            "fieldname": "is_workstation_required",
            "label": "Is Workstation Required",
            "fieldtype": "Check",
            "insert_after": "workstation",
            "read_only": 1
        }
        create_custom_field("Job Card", field)

    # 2. Add is_mould_required to Job Card (replacing is_mould if needed or using it)
    # The existing 'is_mould' might be used, but let's stick to the request's naming if possible or keep both.
    # Actually, is_mould is already there. Let's add is_mould_required if it doesn't exist.
    if not frappe.db.exists("Custom Field", "Job Card-is_mould_required"):
        field = {
            "fieldname": "is_mould_required",
            "label": "Is Mould Required",
            "fieldtype": "Check",
            "insert_after": "mould",
            "read_only": 1
        }
        create_custom_field("Job Card", field)

    frappe.clear_cache(doctype="Job Card")
