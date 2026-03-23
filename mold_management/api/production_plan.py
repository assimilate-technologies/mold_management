import frappe
import json

def populate_operations_from_bom(doc, method):
    """
    On validate of Production Plan, automatically fetch operations from the BOM
    for each po_item and sub_assembly_item, if the item has no operations listed.
    """
    if doc.docstatus == 1:
        return

    for table_name in ["po_items", "sub_assembly_items"]:
        items = doc.get(table_name) or []
        for item in items:
            # If the row has a bom_no but its nested 'operations_data' is empty
            if item.bom_no and not item.get("operations_data"):
                try:
                    bom = frappe.get_doc("BOM", item.bom_no)
                    ops = []
                    for op in bom.operations:
                        ops.append({
                            "operation": op.operation,
                            "workstation": op.workstation,
                            "mould": op.mould or "",
                            "is_mould_required": op.is_mould_required or 0,
                            "is_workstation_required": op.is_workstation_required or 0,
                            "is_quality_inspection_required": op.get("is_quality_inspection_required") or 0,
                            "quality_inspection_template": op.get("quality_inspection_template") or None
                        })
                    item.operations_data = json.dumps(ops)
                except Exception as e:
                    frappe.log_error(f"Error fetching operations for BOM {item.bom_no}: {str(e)}", "Production Plan BOM Fetch")

def validate_production_plan_operations(doc, method=None):
    """
    Validate that all required moulds and workstations are set in operations_data
    for each item in po_items and sub_assembly_items.
    Also ensures that operations data is not changed after submission.
    """
    for table_name in ["po_items", "sub_assembly_items"]:
        items = doc.get(table_name) or []
        for item in items:
            if not item.get("operations_data"):
                continue

            # Normalize JSON formatting if doc is submitted to avoid false-positive diff errors
            if doc.docstatus == 1 and item.name:
                db_val = frappe.db.get_value(item.doctype, item.name, "operations_data")
                if db_val:
                    try:
                        current_ops = json.loads(item.operations_data)
                        db_ops = json.loads(db_val)
                        if current_ops == db_ops:
                            # If content is identical but formatting differs, normalize to DB value
                            item.operations_data = db_val
                        else:
                            # If content actually changed, throw a user-friendly error
                            changed_op_name = ""
                            if len(current_ops) == len(db_ops):
                                for i in range(len(current_ops)):
                                    if current_ops[i] != db_ops[i]:
                                        changed_op_name = current_ops[i].get("operation")
                                        break
                            
                            op_detail = frappe._(" (specifically for operation <b>{0}</b>)").format(changed_op_name) if changed_op_name else ""
                            frappe.throw(
                                frappe._("Row #{0}: You are not allowed to change operations for item <b>{1}</b> after submission.{2}").format(
                                    item.idx, item.get("item_name") or item.get("item_code"), op_detail
                                )
                            )
                    except (json.JSONDecodeError, TypeError):
                        pass

            try:
                ops = json.loads(item.operations_data)
                for op in ops:
                    op_name = op.get("operation")
                    item_display = item.get("item_name") or item.get("item_code")
                    if op.get("is_mould_required") and not op.get("mould"):
                        frappe.throw(
                            frappe._("Row #{0}: Mould is required for operation <b>{1}</b> for item {2}").format(
                                item.idx, op_name, item_display
                            )
                        )
                    if op.get("is_workstation_required") and not op.get("workstation"):
                        frappe.throw(
                            frappe._("Row #{0}: Workstation is required for operation <b>{1}</b> for item {2}").format(
                                item.idx, op_name, item_display
                            )
                        )
            except (json.JSONDecodeError, TypeError):
                # If parsing fails or data is not a list, we might want to log it or skip
                continue

def map_production_plan_operations(doc, method=None):
    """
    Called on before_insert/validate of Work Order.
    Maps workstation and mould from Production Plan Item/Sub Assembly Item to Work Order Operations.
    """
    try:
        if not doc.get("production_plan"):
            return

        # Try to find the source row in Production Plan Item or Sub Assembly Item
        source_row = None
        
        # Check all possible link fields for Production Plan entries
        link_fields = ["production_plan_item", "production_plan_sub_assembly_item", "plan_item"]
        for field in link_fields:
            field_val = doc.get(field)
            if not field_val:
                continue
                
            # Determine the parent doctype
            if field == "production_plan_sub_assembly_item":
                dt = "Production Plan Sub Assembly Item"
            else:
                dt = "Production Plan Item"
                
            try:
                if frappe.db.exists(dt, field_val):
                    source_row = frappe.get_doc(dt, field_val)
                    if source_row: break
            except Exception:
                continue

        if not source_row or not source_row.get("operations_data"):
            return

        ops_data = []
        try:
            ops_data = json.loads(source_row.operations_data)
        except Exception:
            return
            
        if not ops_data or not isinstance(ops_data, list):
            return

        # Create a mapping of operation name (normalized) to its details
        op_map = {}
        for op in ops_data:
            if isinstance(op, dict) and op.get("operation"):
                op_name = str(op.get("operation")).strip().lower()
                op_map[op_name] = op

        for wo_op in doc.get("operations") or []:
            op_name = str(wo_op.operation or "").strip().lower()
            if op_name in op_map:
                custom_op = op_map[op_name]
                if custom_op.get("workstation"):
                    wo_op.workstation = custom_op.get("workstation")
                if custom_op.get("mould"):
                    wo_op.mould = custom_op.get("mould")
                
                # Also map the requirement flags
                if "is_mould_required" in custom_op:
                    wo_op.is_mould_required = custom_op.get("is_mould_required")
                if "is_workstation_required" in custom_op:
                    wo_op.is_workstation_required = custom_op.get("is_workstation_required")
                    
    except Exception as e:
        # We use a broad try-except to ensure 'validate' NEVER blocks document save
        # even if something goes wrong in the custom mapping logic.
        frappe.log_error(f"Error mapping operations from Production Plan {doc.get('production_plan')}: {str(e)}", "Work Order Op Mapping Error")

def map_mould_to_job_card(doc, method=None):
    """
    Called on before_insert of Job Card.
    Maps mould and workstation from Work Order Operation to Job Card.
    """
    if not doc.work_order or not doc.operation_id:
        return

    try:
        # Fetch mould, workstation and requirement flags from Work Order Operation row
        wo_op = frappe.db.get_value("Work Order Operation", doc.operation_id, ["mould", "workstation", "is_mould_required", "is_workstation_required"], as_dict=1)
        
        if wo_op:
            if wo_op.mould:
                doc.mould = wo_op.mould
            if wo_op.workstation:
                doc.workstation = wo_op.workstation
            
            # Map requirement flags
            if "is_mould_required" in wo_op:
                doc.is_mould_required = wo_op.is_mould_required
                # Use existing field if present
                if hasattr(doc, "is_mould"):
                    doc.is_mould = wo_op.is_mould_required
                    
            if "is_workstation_required" in wo_op:
                doc.is_workstation_required = wo_op.is_workstation_required
                
    except Exception as e:
        frappe.log_error(f"Error mapping mould to Job Card {doc.name}: {str(e)}", "Job Card Mould Mapping")
