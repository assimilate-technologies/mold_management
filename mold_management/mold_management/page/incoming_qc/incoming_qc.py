import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist()
def get_template_from_ref(ref_type, ref_name):
    if not ref_type or not ref_name:
        return None
        
    if ref_type == "Quality Inspection":
        return frappe.db.get_value("Quality Inspection", ref_name, "quality_inspection_template")
    
    if ref_type == "Purchase Receipt":
        # First, check if there's already a Quality Inspection linked to this PR
        linked_template = frappe.db.get_value("Quality Inspection", 
            {"reference_name": ref_name, "docstatus": ["<", 2]}, 
            "quality_inspection_template"
        )
        if linked_template:
            return linked_template

        # Fallback: Get template from the first item in the purchase receipt
        pr_item = frappe.get_all("Purchase Receipt Item", 
            filters={"parent": ref_name}, 
            fields=["item_code"], 
            limit=1
        )
        if pr_item:
            return frappe.db.get_value("Item", pr_item[0].item_code, "quality_inspection_template")
            
    return None

@frappe.whitelist()
@frappe.whitelist()
def get_report_data(reference_name=None, quality_inspection_template=None):
    if not reference_name:
        # Show empty preview with latest Incoming/PDI template parameters
        latest_template = frappe.db.get_value("Quality Inspection Template", 
            {"inspection_type": ["in", ["Incoming", "PDI"]]}, "name", order_by="creation desc")
        if not latest_template:
            return []
        
        # Build empty sheet
        dummy_qi = frappe._dict({
            "name": "", "item_code": "", "quality_inspection_template": latest_template,
            "readings": [], "doc_no": "YPEW/QA-F-02", "rev_no": "00", "rev_date": "01.02.2021"
        })
        return [build_sheet_data(dummy_qi, latest_template)]

    # Identify if it's a Quality Inspection directly or a Purchase Receipt
    is_pr = frappe.db.exists("Purchase Receipt", reference_name)
    is_qi = frappe.db.exists("Quality Inspection", reference_name)
    
    inspections = []
    if is_pr:
        # Fetch ALL quality inspections linked to this PR
        inspections = frappe.get_all("Quality Inspection", 
            filters={"reference_name": reference_name, "docstatus": ["<", 2], "inspection_type": ["in", ["Incoming", "PDI"]]},
            fields=["*"],
            order_by="creation asc"
        )
    elif is_qi:
        qi = frappe.get_doc("Quality Inspection", reference_name)
        inspections = [qi]
    
    if not inspections:
        # Final fallback: search for ANY QI with this reference
        inspections = frappe.get_all("Quality Inspection", 
            filters={"name": reference_name, "docstatus": ["<", 2]},
            fields=["*"]
        )

    report_data = []
    for qi_data in inspections:
        qi = frappe.get_doc("Quality Inspection", qi_data.name) if isinstance(qi_data, dict) else qi_data
        sheet = build_sheet_data(qi, quality_inspection_template)
        report_data.append(sheet)

    return report_data

def build_sheet_data(qi, custom_template=None):
    item_code = qi.get("item_code") or ""
    item = None
    if item_code:
        item = frappe.get_doc("Item", item_code)
    else:
        item = frappe._dict({"item_name": "", "control_plan": "", "raw_material": ""})
    
    # Comprehensive Template Discovery
    template_name = custom_template or qi.get("quality_inspection_template")
    
    if not template_name and item:
        template_name = item.get("quality_inspection_template")
        
    if not template_name and item_code:
        # Final attempt: look for a default template for this item and inspection type
        template_name = frappe.db.get_value("Quality Inspection Template", 
            {"inspection_type": ["in", ["Incoming", "PDI"]]}, "name")

    parameters = []
    if template_name:
        parameters = frappe.get_all("Item Quality Inspection Parameter",
            filters={"parent": template_name},
            fields=["*"],
            order_by="idx"
        )
    
    # If no parameters from template, try to get them from the Quality Inspection's own table if it exists
    if not parameters and qi.get("name"):
        parameters = frappe.get_all("Quality Inspection Item",
            filters={"parent": qi.name},
            fields=["*", "specification as specification", "acceptance_criteria as acceptance_criteria_value"],
            order_by="idx"
        )

    # Fetch readings
    qi.readings = frappe.get_all("Quality Inspection Reading",
        filters={"parent": qi.name},
        fields=["*"]
    )

    # Header Data
    vendor = qi.get("supplier_name") or qi.get("supplier") or qi.get("vendor_name") or qi.get("vendor") or ""
    if not vendor:
        # Try fetching from Purchase Receipt if linked
        if qi.get("reference_type") == "Purchase Receipt":
            vendor = frappe.db.get_value("Purchase Receipt", qi.reference_name, "supplier_name") or frappe.db.get_value("Purchase Receipt", qi.reference_name, "supplier")
        elif qi.get("reference_type") == "Purchase Order":
            vendor = frappe.db.get_value("Purchase Order", qi.reference_name, "supplier_name") or frappe.db.get_value("Purchase Order", qi.reference_name, "supplier")

    batch_no = qi.get("batch_no") or ""
    sample_size = qi.get("sample_size") or ""
    
    # Try to find lot quantity from reference
    lot_qty = ""
    if qi.get("reference_name") and qi.get("reference_type") == "Purchase Receipt":
        lot_qty = frappe.db.get_value("Purchase Receipt Item", 
            {"parent": qi.reference_name, "item_code": item_code}, "qty")
    elif qi.get("reference_name") and qi.get("reference_type") == "Purchase Order":
        lot_qty = frappe.db.get_value("Purchase Order Item", 
            {"parent": qi.reference_name, "item_code": item_code}, "qty")
    
    # Prepare a clean serializable QI dict to avoid internal Frappe serialization issues
    qi_clean = {
        "name": qi.name,
        "item_code": qi.item_code,
        "item_name": item.item_name or "",
        "status": qi.get("status") or "",
        "docstatus": qi.get("docstatus") or 0,
        "inspection_type": qi.get("inspection_type") or "",
        "report_date": qi.get("report_date") or "",
        "sample_size": qi.get("sample_size") or ""
    }
    # Add all readings as clean dicts
    qi_clean["readings"] = [r if isinstance(r, dict) else r.as_dict() for r in qi.readings]

    return {
        "qi": {
            "name": qi.name,
            "item_code": qi.item_code,
            "batch_no": qi.get("batch_no") or "",
            "vendor": vendor,
            "reference": qi.get("reference_name") or "",
            "sample_size": qi.get("sample_size") or "",
            "challan_no": qi.get("challan_no") or "",
            "challan_date": qi.get("challan_date") or "",
            "doc_no": "YPEW/QA-F-02",
            "rev_no": "00",
            "rev_date": "01.02.2021",
            "status": qi.get("status") or "",
            "rejection_reason": qi.get("rejection_reason") or ""
        },
        "item": {
            "item_name": item.item_name or "",
            "control_plan": item.get("control_plan") or "-F/YPEW/QA/CP/08",
            "raw_material": item.get("raw_material") or ""
        },
        "template_name": template_name,
        "parameters": [p if isinstance(p, dict) else p.as_dict() for p in parameters],
        "inspections": [qi_clean],
        "today": qi.get("report_date") or nowdate(),
        "vendor": vendor,
        "qty": flt(lot_qty) or ""
    }
