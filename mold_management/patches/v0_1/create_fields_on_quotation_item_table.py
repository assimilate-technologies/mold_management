import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field


def execute():
    print("Adding custom fields to Quotation Item...")

    fields = [
        {
            "fieldname": "is_mould_item",
            "label": "Is Mould Item",
            "fieldtype": "Check",
            "insert_after": "item_name",
            "fetch_from": "item_code.is_mould_item",
        },
        {
            "fieldname": "shape",
            "label": "Shape",
            "fieldtype": "Link",
            "options": "Shape",
            "insert_after": "is_mould_item",
            "fetch_from": "item_code.shape",
        },
        {
            "fieldname": "material_type",
            "label": "Material Type",
            "fieldtype": "Link",
            "options": "Material Type",
            "insert_after": "shape",
            "fetch_from": "item_code.material_type",
        },
        {
            "fieldname": "side_cores",
            "label": "Side Cores",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "material_type",
            "fetch_from": "item_code.side_cores",
        },
        {
            "fieldname": "side_cores_qty",
            "label": "Side Cores Qty",
            "fieldtype": "Data",
            "insert_after": "side_cores",
            "fetch_from": "item_code.side_cores_qty",
        },
        {
            "fieldname": "no_of_cavity",
            "label": "No of Cavity",
            "fieldtype": "Data",
            "insert_after": "side_cores_qty",
            "fetch_from": "item_code.no_of_cavity",
        },
        {
            "fieldname": "total_shots",
            "label": "Total Shots",
            "fieldtype": "Data",
            "insert_after": "no_of_cavity",
            "fetch_from": "item_code.total_shots",
        },
        {
            "fieldname": "tool_life",
            "label": "Tool Life",
            "fieldtype": "Data",
            "insert_after": "total_shots",
            "fetch_from": "item_code.tool_life",
        },
        {
            "fieldname": "hot_runner_system",
            "label": "Hot Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "tool_life",
            "fetch_from": "item_code.hot_runner_system",
        },
        {
            "fieldname": "cold_runner_system",
            "label": "Cold Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "hot_runner_system",
            "fetch_from": "item_code.cold_runner_system",
        },
        {
            "fieldname": "mould_name",
            "label": "Mould Name",
            "fieldtype": "Data",
            "insert_after": "cold_runner_system",
            "fetch_from": "item_code.mould_name",
        },
        {

            "fieldname": "mould_ti",
            "label": "Mould Type",
            "fieldtype": "Link",
            "options": "Mould Type",
            "insert_after": "mould_name",
            "fetch_from": "item_code.mould_ty"
        }
    ]

    for field in fields:
        try:
            create_custom_field("Quotation Item", field)
            print(f"Created: {field['fieldname']}")
        except Exception as e:
            print(f"Skipping {field['fieldname']} (maybe exists) → {e}")

    frappe.clear_cache()
    print("Custom fields added successfully.")
