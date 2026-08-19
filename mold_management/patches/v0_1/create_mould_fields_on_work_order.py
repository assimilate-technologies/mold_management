import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    print("Adding custom fields to Work Order...")

    fields = [
        {
            "fieldname": "is_mould_item",
            "label": "Is Mould Item",
            "fieldtype": "Check",
            "insert_after": "project",
            "hidden":1,
            "fetch_from": "production_item.is_mould_item",
        },
        {
            "fieldname": "shape",
            "label": "Shape",
            "fieldtype": "Link",
            "options": "Shape",
            "insert_after": "is_mould_item",
            "hidden":1,
            "fetch_from": "production_item.shape",
        },
        {
            "fieldname": "material_type",
            "label": "Material Type",
            "fieldtype": "Link",
            "options": "Material Type",
            "insert_after": "shape",
            "hidden":1,
            "fetch_from": "production_item.material_type",
        },
        {
            "fieldname": "side_cores",
            "label": "Side Cores",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "material_type",
            "hidden":1,
            "fetch_from": "production_item.side_cores",
        },
        {
            "fieldname": "side_cores_qty",
            "label": "Side Cores Qty",
            "fieldtype": "Data",
            "insert_after": "side_cores",
            "hidden":1,
            "fetch_from": "production_item.side_cores_qty",
        },
        {
            "fieldname": "no_of_cavity",
            "label": "No of Cavity",
            "fieldtype": "Data",
            "insert_after": "side_cores_qty",
            "hidden":1,
            "fetch_from": "production_item.no_of_cavity",
        },
        {
            "fieldname": "total_shots",
            "label": "Total Shots",
            "fieldtype": "Data",
            "insert_after": "no_of_cavity",
            "hidden":1,
            "fetch_from": "production_item.total_shots",
        },
        {
            "fieldname": "tool_life",
            "label": "Tool Life",
            "fieldtype": "Data",
            "insert_after": "total_shots",
            "hidden":1,
            "fetch_from": "production_item.tool_life",
        },
        {
            "fieldname": "hot_runner_system",
            "label": "Hot Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "tool_life",
            "hidden":1,
            "fetch_from": "production_item.hot_runner_system",
        },
        {
            "fieldname": "cold_runner_system",
            "label": "Cold Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "hot_runner_system",
            "hidden":1,
            "fetch_from": "production_item.cold_runner_system",
        },
        {
            "fieldname": "mould_name",
            "label": "Mould Name",
            "fieldtype": "Data",
            "insert_after": "cold_runner_system",
            "hidden":1,
            "fetch_from": "production_item.mould_name",
        },
        {
            
            "fieldname": "mould_ti",
            "label": "Mould Type",
            "fieldtype": "Link",
            "options": "Mould Type",
            "insert_after": "mould_name",
            "hidden":1,
            "fetch_from": "production_item.mould_ty"
        },
        {
            "fieldname": "total_lifecycle_sho",
            "label": "Total Lifecycle Shot",
            "fieldtype": "Data",
            "insert_after": "mould_ti",
            "hidden":1,
            "fetch_from": "production_item.total_lifecycle_shot"
        }
    ]

    for field in fields:
        try:
            create_custom_field("Work Order", field)
            print(f"Created: {field['fieldname']}")
        except Exception as e:
            print(f"Skipping {field['fieldname']} (maybe exists) → {e}")

    frappe.clear_cache()
    print("Custom fields added successfully.")
