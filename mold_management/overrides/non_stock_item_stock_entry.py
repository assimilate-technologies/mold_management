import frappe
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
 
 
class CustomStockEntry(StockEntry):
 
    def has_non_stock_items(self):
        """Check if Stock Entry contains any non-stock item"""
        for row in self.items:
            is_stock = frappe.get_cached_value(
                "Item", row.item_code, "is_stock_item"
            )
            if not is_stock:
                return True
        return False
 
    def validate(self):
        """
        - Normal ERPNext validation if all items are stock items
        - Relaxed validation ONLY if non-stock item exists
        """
 
        if not self.has_non_stock_items():
            # ✅ PURE ERPNext FLOW
            return super().validate()
 
        # 🔓 CUSTOM FLOW (only when non-stock item exists)
        # Skip expense account validation
        # Keep basic sanity checks only
 
        if not self.items:
            frappe.throw("Items table cannot be empty")
 
        # Do NOT call super().validate()
        return
 
    def on_submit(self):
        """
        - Normal ERPNext submit if all items are stock items
        - Custom submit when non-stock items exist
        """
 
        if not self.has_non_stock_items():
            # ✅ PURE ERPNext FLOW
            return super().on_submit()
 
        # 🔓 Custom submit logic
        self.update_stock_ledger()
 
    def make_sl_entries(self, sl_entries, *args, **kwargs):
        """
        - Create SLE only for stock items
        """
        filtered = []
 
        for sle in sl_entries:
            is_stock = frappe.get_cached_value(
                "Item", sle.get("item_code"), "is_stock_item"
            )
            if is_stock:
                filtered.append(sle)
 
        super().make_sl_entries(
            filtered,
            *args,
            **kwargs
        )
 
 
   
 
    def on_submit(self):
        """
        Handle Work Order completion when FG is non-stock
        """
 
        # Normal ERPNext flow
        if not self.has_non_stock_items():
            return super().on_submit()
 
        # Custom flow
        self.update_stock_ledger()
 
        # ---- HANDLE WORK ORDER COMPLETION ----
        if self.work_order:
            wo = frappe.get_doc("Work Order", self.work_order)
 
            fg_is_stock = frappe.get_cached_value(
                "Item", wo.production_item, "is_stock_item"
            )
 
            # If FG is NON-STOCK → force completion
            if not fg_is_stock:
                wo.produced_qty = wo.qty
                wo.material_transferred_for_manufacturing = wo.qty
                wo.status = "Completed"
 
                wo.flags.ignore_validate_update_after_submit = True
                wo.db_update()
 
                frappe.db.commit()