import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    fields = [
        
       
    ]

    for df in fields:
        create_custom_field("Item", df)
