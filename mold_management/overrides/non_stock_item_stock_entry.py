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

    def make_sl_entries(self, sl_entries, allow_negative_stock=False, via_landed_cost_voucher=False, *args, **kwargs):
        """
        - Create SLE only for stock items with non-zero quantity (or Stock Reconciliation)
        """
        filtered = []

        for sle in sl_entries:
            is_stock = frappe.get_cached_value(
                "Item", sle.get("item_code"), "is_stock_item"
            )
            if is_stock and (sle.get("actual_qty") or sle.get("voucher_type") == "Stock Reconciliation"):
                filtered.append(sle)

        super().make_sl_entries(
            filtered,
            allow_negative_stock=allow_negative_stock,
            via_landed_cost_voucher=via_landed_cost_voucher,
            *args,
            **kwargs
        )

    def on_submit(self):
        """
        - Normal ERPNext submit if all items are stock items
        - Custom submit when non-stock items exist
        - Handle Work Order completion when FG is non-stock
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