frappe.pages["daily-production-rep"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "Daily Production Report",
		single_column: true,
	});
	wrapper.page = page;

	page.add_menu_item(__("Download PDF"), () => {
		const doc = wrapper.records ? wrapper.records[0] : null;
		if (!doc || !doc.name) {
			frappe.msgprint(__("No record loaded to download."));
			return;
		}
		const url =
			frappe.urllib.get_full_url(
				"/api/method/mold_management.mold_management.page.daily_production_rep.daily_production_rep.download_pdf",
			) +
			"?name=" +
			doc.name;
		window.open(url, "_blank");
	});

	page.add_menu_item(__("Download Excel"), () => {
		const doc = wrapper.records ? wrapper.records[0] : null;
		if (!doc || !doc.name) {
			frappe.msgprint(__("No record loaded to download."));
			return;
		}
		const url =
			frappe.urllib.get_full_url(
				"/api/method/mold_management.mold_management.page.daily_production_rep.daily_production_rep.download_excel",
			) +
			"?name=" +
			doc.name;
		window.open(url, "_blank");
	});

	page.add_menu_item(__("Print"), () => {
		window.print();
	});
};

frappe.pages["daily-production-rep"].on_page_show = function (wrapper) {
	const page = wrapper.page;

	// Clear previous content to avoid stale data
	$(page.body).empty();

	wrapper.records = [];
	const container = $(`<div class="daily-production-report-container"></div>`);
	$(page.body).append(container);

	const route = frappe.get_route();
	const log_name = route && route[1] ? route[1] : null;

	function renderPage(doc) {
		if (!doc) {
			container.html("<p>No records found.</p>");
			return;
		}

		const html = `
            <style>
                @media print {
                    .pagination-controls, .page-head, .navbar, .page-actions, .menu-btn-group, .sidebar-left { display: none !important; }
                    .daily-production-report-container { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
                    .report-wrapper { border: 1px solid #000; padding: 5px !important; width: 100% !important; max-width: none !important; }
                }
                .report-wrapper { border: 1px solid #000; padding: 12px; background: #fff; max-width: 1000px; margin: 0 auto; font-family: sans-serif; line-height: 1.25; color: #000; }
                .report-table { width: 100%; border-collapse: collapse; margin-bottom: 0; table-layout: fixed; border: 1px solid #000; }
                .report-table th, .report-table td { border: 1px solid #000; padding: 2px 5px; text-align: left; vertical-align: middle; height: 18px; }
                .report-table th { background-color: #f2f2f2; text-align: center; text-transform: uppercase; font-size: 11px; font-weight: bold; }
                .text-center { text-align: center !important; }
                .font-bold { font-weight: bold; }
                .label-cell { background-color: #f8f8f8; font-weight: bold; font-size: 11px; color: #000; text-transform: uppercase; }
                .value-cell { font-weight: normal; font-size: 11px; color: #000; }
                .title-large { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
                .metadata-small { font-size: 9px; line-height: 1.1; color: #555; }
                .rejection-codes { font-size: 10px; margin-top: 8px; border: 1px solid #000; padding: 8px; line-height: 1.4; background: #fff; }
                .table-spacing { margin-top: -1.5px; }
            </style>

            <div class="report-wrapper">
                <!-- Header -->
                <table class="report-table">
                    <tr>
                        <td colspan="3" class="text-center font-bold" style="width: 30%;">${doc.company || "YASH PLASTIC & ENGG WORKS"}</td>
                        <td colspan="4" class="text-center title-large" style="width: 40%;">DAILY PRODUCTION REPORT</td>
                        <td colspan="3" class="metadata-small" style="width: 30%;">
                            Doc No : ${doc.doc_no || ""},<br>
                            REV No & Dt : ${doc.rev_no || ""}<br>
                            Page : ${doc.page_no || "01"} of ${doc.total_pages || "01"}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" class="label-cell">SHIFT DETAILS:</td>
                        <td colspan="2" class="text-center value-cell">${doc.shift || ""}</td>
                        <td colspan="1" class="label-cell">DATE:</td>
                        <td colspan="2" class="text-center value-cell">${doc.report_date || ""}</td>
                        <td colspan="2" class="label-cell">MACHINE NO:</td>
                        <td colspan="1" class="text-center value-cell">${doc.machine_no || ""}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="label-cell">PRODUCT NAME:</td>
                        <td colspan="5" class="value-cell">${doc.product_name || ""}</td>
                        <td colspan="3" class="value-cell"><span class="label-cell" style="background:transparent; border:none; padding:0;">OPERATOR NAME:</span> <span style="margin-left: 5px;">${doc.operator_name || ""}</span></td>
                    </tr>
                </table>

                <!-- Metadata Grid -->
                <table class="report-table table-spacing">
                    <tr>
                        <td colspan="2" class="label-cell" style="width: 20%;">SHOT WEIGHT:</td>
                        <td colspan="1" class="text-center value-cell" style="width: 10%;">${doc.shot_weight || ""}</td>
                        <td colspan="2" class="label-cell" style="width: 20%;">RUNNER WEIGHT:</td>
                        <td colspan="1" class="text-center value-cell" style="width: 10%;">${doc.runner_weight || ""}</td>
                        <td colspan="2" class="label-cell" style="width: 20%;">ITEM CODE NO:</td>
                        <td colspan="2" class="text-center value-cell" style="width: 20%;">${doc.item_code || ""}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="label-cell">RAW MATERIAL:</td>
                        <td colspan="1" class="text-center value-cell">${doc.raw_material || ""}</td>
                        <td colspan="2" class="label-cell">GRADE:</td>
                        <td colspan="1" class="text-center value-cell">${doc.raw_material_grade || ""}</td>
                        <td colspan="2" class="label-cell">BATCH NO:</td>
                        <td colspan="2" class="text-center value-cell">${doc.raw_material_batch_no || ""}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="label-cell">MASTERBATCH:</td>
                        <td colspan="1" class="text-center value-cell">${doc.masterbatch || ""}</td>
                        <td colspan="2" class="label-cell">GRADE:</td>
                        <td colspan="1" class="text-center value-cell">${doc.masterbatch_grade || ""}</td>
                        <td colspan="2" class="label-cell">BATCH NO:</td>
                        <td colspan="2" class="text-center value-cell">${doc.masterbatch_batch_no || ""}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="label-cell">FIRST COUNTER:</td>
                        <td colspan="1" class="text-center value-cell">${doc.first_counter || ""}</td>
                        <td colspan="2" class="label-cell">CYCLE TIME:</td>
                        <td colspan="1" class="text-center value-cell">${doc.cycle_time || ""}</td>
                        <td colspan="2" class="label-cell">SHIFT TARGET:</td>
                        <td colspan="2" class="text-center value-cell">${doc.shift_target || ""}</td>
                    </tr>
                </table>

                <!-- Row for Total Cavity and Hourly Target -->
                <table class="report-table table-spacing">
                    <tr>
                       <td colspan="2" class="label-cell" style="width: 20%;">TOTAL NO CAVITY:</td>
                       <td colspan="1" class="text-center value-cell" style="width: 10%;">${doc.total_cavity || ""}</td>
                       <td colspan="2" class="label-cell" style="width: 20%;">RUNNING CAVITY:</td>
                       <td colspan="1" class="text-center value-cell" style="width: 10%;">${doc.running_cavity || ""}</td>
                       <td colspan="2" class="label-cell" style="width: 20%;">ANTI STATIC:</td>
                       <td colspan="2" class="text-center value-cell" style="width: 20%;">${doc.anti_static || ""}</td>
                    </tr>
                </table>

                <!-- Production Data Table -->
                <table class="report-table table-spacing">
                    <thead>
                        <tr>
                            <th style="width: 10%;">TIME</th>
                            <th style="width: 10%;">OK SHOTS</th>
                            <th style="width: 10%;">REJ SHOTS</th>
                            <th style="width: 10%;">TOTAL SHOTS</th>
                            <th style="width: 20%;">REJ CODE</th>
                            <th style="width: 40%;">REMARKS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
							doc.production_data && doc.production_data.length
								? doc.production_data
										.map(
											(row) => `
                            <tr>
                                <td class="text-center value-cell">${row.time_slot || ""}</td>
                                <td class="text-center value-cell">${row.ok_shots ?? 0}</td>
                                <td class="text-center value-cell">${row.rej_shots ?? 0}</td>
                                <td class="text-center value-cell">${row.total_shots ?? 0}</td>
                                <td class="text-center value-cell">${row.rej_code || ""}</td>
                                <td>${row.remarks || ""}</td>
                            </tr>
                        `,
										)
										.join("")
								: '<tr><td colspan="6" class="text-center" style="height: 100px; color:#888;">No Production Data Recorded</td></tr>'
						}
                    </tbody>
                </table>

                <!-- Summary Footer -->
                <table class="report-table table-spacing">
                    <tr>
                        <td class="label-cell text-center" style="width: 12%;">LAST COUNTER</td>
                        <td class="text-center value-cell" style="width: 10%;">${doc.last_counter || ""}</td>
                        <td class="text-center value-cell" style="width: 10%;">${doc.total_ok_shots || 0}</td>
                        <td class="text-center value-cell" style="width: 10%;">${doc.total_rej_shots || 0}</td>
                        <td class="text-center value-cell" style="width: 10%;">${doc.total_shots || 0}</td>
                        <td class="label-cell text-center" style="width: 18%;">RM CONSUMPTION</td>
                        <td class="label-cell text-center" style="width: 10%;">LUMPS</td>
                        <td class="label-cell text-center font-bold" style="width: 20%;">SHIFT SUPERVISOR/ QC SIGN</td>
                    </tr>
                    <tr>
                        <td colspan="5" style="border-right: 1.5px solid #000;"></td>
                        <td class="text-center value-cell" style="height: 60px;">${doc.rm_consumption || 0} ${doc.rm_uom || ""}</td>
                        <td class="text-center value-cell">${doc.lumps || ""}</td>
                        <td style="vertical-align: bottom; height: 60px;">
                            <div style="text-align: right; font-style: italic; color: #777; padding: 5px;">${doc.supervisor_sign ? "Signed" : ""}</div>
                        </td>
                    </tr>
                </table>

                <div class="rejection-codes">
                    <strong class="label-cell" style="background:transparent; border:none; padding:0;">Defect Codes:</strong><br>
                    ${(doc.rejection_codes_list || []).map((c) => `${c.name}${c.rejection_name ? " - " + c.rejection_name : ""}`).join(", ")}
                </div>
            </div>
        `;

		container.html(html);
	}

	// Fetch Data
	frappe.call({
		method: "mold_management.mold_management.page.daily_production_rep.daily_production_rep.get_production_log_details",
		args: {
			name: log_name,
		},
		callback: function (r) {
			if (r.message) {
				wrapper.records = Array.isArray(r.message) ? r.message : [r.message];
				renderPage(wrapper.records[0]);
			}
		},
	});
};
