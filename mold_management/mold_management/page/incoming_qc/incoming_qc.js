frappe.pages["incoming-qc"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "Incoming QC Report",
		single_column: true,
	});

	const route_options = frappe.route_options;
	const reference_name = route_options ? route_options.reference_name : "";
	const route_template = route_options ? route_options.quality_inspection_template : "";
	frappe.route_options = null;

	$(`
		<div class="row mb-4 no-print">
			<div class="col-md-3">
				<div id="ref_type_filter"></div>
			</div>
			<div class="col-md-3">
				<div id="reference_filter"></div>
			</div>
			<div class="col-md-3">
				<div id="template_filter"></div>
			</div>
			<div class="col-md-3 d-flex align-items-end">
				<button class="btn btn-primary btn-sm me-2" id="btn-refresh" style="margin-bottom: 2px;"><i class="fa fa-refresh"></i> Refresh</button>
				<button class="btn btn-secondary btn-sm" id="btn-print" style="margin-bottom: 2px;"><i class="fa fa-print"></i> Print</button>
			</div>
		</div>
		
		<div id="report-container" class="report-container">
			<p class="text-center text-muted">Initialize Report...</p>
		</div>

		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
			.report-container { background: #f0f2f5; padding: 20px; border-top: 1px solid #d1d8dd; }
			.inspection-sheet-wrapper { background: #fff; padding: 15px; border: 1px solid #ddd; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin: 0 auto 30px; max-width: 1400px; color: #000; font-family: 'Inter', sans-serif; }
			.logo-text { font-size: 26px; font-weight: bold; padding: 0; margin: 0; }
			.sheet-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; }
			.inspection-sheet { width: 100%; border-collapse: collapse; margin-bottom: 0px; table-layout: fixed; border: 1px solid #000; }
			.inspection-sheet td, .inspection-sheet th { border: 1px solid #000; padding: 4px; vertical-align: middle; overflow: hidden; }
			.header-label { font-size: 9px; background-color: #ffffff; font-weight: 500; height: 35px; width: auto; }
			.header-value { font-size: 10px; font-weight: 700; border: none; white-space: normal; word-break: break-word; }
			.text-center { text-align: center; }
			.text-bold { font-weight: bold; }
			.table-header th { background-color: #ffffff; font-size: 9px; text-align: center; font-weight: 700; height: 25px; }
			.param-row td { font-size: 10px; height: 32px; padding: 2px 4px; }
			.no-border { border: none !important; }
			
			@media print {
				@page { size: A4 landscape; margin: 5mm !important; }
				
			@media print {
				@page { size: A4 landscape; margin: 5mm !important; }
				
				/* Universal Hiding of Website interface */
				nav, .navbar, .page-head, .header-container, #report-filters, 
				.print-btn-container, .side-panel, .standard-sidebar, .sidebar-left,
				.layout-side-section, .page-actions, .breadcrumb, .page-header,
				.header-inner, .search-bar, .notifications, .offcanvas,
				footer, .help-menu, .alert, .message-bar, .side-section { 
					display: none !important; 
					visibility: hidden !important;
					height: 0 !important;
					width: 0 !important;
					margin: 0 !important;
					padding: 0 !important;
				}
				
				/* Structure for Printing */
				html, body, .page-container, .page-content, .page-body, #report-container, .layout-main-section { 
					background: #fff !important;
					display: block !important;
					padding: 0 !important;
					margin: 0 !important;
					width: 100% !important;
					height: auto !important;
					overflow: visible !important;
					position: static !important;
				}

				.inspection-sheet-wrapper { 
					display: block !important;
					width: 100% !important;
					max-width: none !important;
					padding: 0 !important;
					margin: 0 !important;
					border: none !important;
					box-shadow: none !important;
					page-break-after: always !important;
					break-after: page !important;
					page-break-inside: avoid !important;
					break-inside: avoid !important;
				}
				
				.inspection-sheet { 
					width: 100% !important; 
					table-layout: fixed !important; 
					border-collapse: collapse !important; 
					border: 1px solid #000 !important;
					margin: 0 !important;
				}
				
				.inspection-sheet th, .inspection-sheet td { 
					border: 1px solid #000 !important; 
					padding: 2px 4px !important; 
					font-size: 8.5px !important; 
					line-height: 1.1 !important; 
					color: #000 !important;
				}
				
				.logo-text { font-size: 20px !important; font-weight: 800 !important; line-height: 2 !important; }
				.sheet-title { font-size: 15px !important; font-weight: 600 !important; text-align: center !important; margin: 3px 0 !important; border: none !important; }
				.header-label { background: transparent !important; }
				.text-bold { font-weight: bold !important; }
			}
			}
		</style>
	`).appendTo(page.body);

	const ref_type_field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#ref_type_filter"),
		df: {
			label: "Reference Type",
			fieldname: "reference_type",
			fieldtype: "Select",
			options: "Quality Inspection\nPurchase Receipt",
			default: "Quality Inspection",
			onchange: () => {
				const type = ref_type_field.get_value();
				field.df.options = type;
				field.refresh();
				field.set_value("");
			},
		},
		render_input: true,
	});

	const field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#reference_filter"),
		df: {
			label: "Reference Name",
			fieldname: "reference_name",
			fieldtype: "Link",
			options: "Quality Inspection",
			get_query: () => {
				const type = ref_type_field.get_value();
				if (type === "Quality Inspection") {
					return {
						filters: {
							inspection_type: ["in", ["Incoming", "PDI"]],
							docstatus: ["in", [0, 1]],
						},
					};
				}
				return { filters: { docstatus: ["in", [0, 1]] } };
			},
			default: reference_name,
			onchange: async () => {
				const val = field.get_value();
				const type = ref_type_field.get_value();

				if (val) {
					if (type === "Purchase Receipt") {
						// For PR, clear template filter to let each item use its own
						template_field.set_value("");
					} else {
						// For single QI, fetch its specific template
						const template = await frappe.xcall(
							"mold_management.mold_management.page.incoming_qc.incoming_qc.get_template_from_ref",
							{
								ref_type: type,
								ref_name: val,
							},
						);
						if (template) {
							template_field.set_value(template);
						}
					}
				}
				load_report_data();
			},
		},
		render_input: true,
	});

	const template_field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#template_filter"),
		df: {
			label: "Quality Inspection Template",
			fieldname: "quality_inspection_template",
			fieldtype: "Link",
			options: "Quality Inspection Template",
			get_query: () => ({ filters: { inspection_type: ["in", ["Incoming", "PDI"]] } }),
			default: route_template,
			onchange: () => load_report_data(),
		},
		render_input: true,
	});

	$(wrapper)
		.find("#btn-refresh")
		.on("click", () => load_report_data());
	$(wrapper)
		.find("#btn-print")
		.on("click", () => window.print());

	load_report_data();

	async function load_report_data() {
		const ref = field && typeof field.get_value === "function" ? field.get_value() : "";
		const template =
			template_field && typeof template_field.get_value === "function"
				? template_field.get_value()
				: null;
		$(wrapper)
			.find("#report-container")
			.html(
				'<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Generating Report...</p></div>',
			);

		try {
			const res = await frappe.call({
				method: "mold_management.mold_management.page.incoming_qc.incoming_qc.get_report_data",
				args: { reference_name: ref, quality_inspection_template: template },
			});
			if (!res.message || !res.message.length) {
				$(wrapper)
					.find("#report-container")
					.html('<div class="alert alert-warning text-center">No data found.</div>');
				return;
			}
			render_report(res.message);
		} catch (err) {
			console.error(err);
			$(wrapper)
				.find("#report-container")
				.html('<div class="alert alert-danger">Error fetching report data.</div>');
		}
	}

	function render_report(sheets) {
		const container = $("#report-container").empty();

		// Add a dedicated Print button at the top (only visible on screen)
		const btn_html = `
			<div class="print-btn-container text-right" style="padding: 10px 0; max-width: 1400px; margin: 0 auto;">
				<button class="btn btn-primary btn-sm" onclick="window.print()">
					<i class="fa fa-print"></i> Print QC Report
				</button>
			</div>
		`;
		container.append(btn_html);

		sheets.forEach((sheet, idx) => {
			container.append(build_sheet_html(sheet));
			if (idx < sheets.length - 1) container.append('<div class="page-break"></div>');
		});
	}

	function build_sheet_html(data) {
		const qi = data.qi || {};
		const item = data.item || {};
		const parameters = data.parameters || [];
		console.log(data);

		return `
			<div class="inspection-sheet-wrapper">
				<!-- Header Section -->
				<table class="inspection-sheet">
					<colgroup>
						${Array(100)
							.fill(0)
							.map(() => '<col style="width: 1%;">')
							.join("")}
					</colgroup>
					<tr>
						<td  colspan="12" class="text-center">
							<div class="logo-text" style="font-weight: 800; font-size: 20px; line-height: 2;">EXIDE</div>
						</td>
						<td  colspan="73" class="text-center">
							<div class="sheet-title" style="font-size: 16px; font-weight: 600; margin: 3px 0;">INCOMING / PDI INSPECTION SHEET</div>
							<div>${data.template_name || ""}</div>
						</td>
						<td  colspan="15" style="font-size: 7px; line-height: 1.2;">
							Doc No : YPEW/QA-F-02<br>
							Rev No 00 Rev date : 01.02.2021
						</td>
					</tr>
					<tr>
						<td  colspan="20" class="header-label">Vendor : <span class="header-value text-bold" style="font-size: 9px; text-transform: uppercase;">${data.vendor || data.qi.vendor || ""}</span></td>
						<td  colspan="10" >${data.qi.supplier_name || ""}</td>
						<td  colspan="10" class="header-label text-center">Part number</td>
						<td colspan="10" class="header-value text-center text-bold">${data.qi.item_code}</td>
						<td  colspan="25" class="header-label ">Part Name : ${data.item.item_name || ""}</td>
						<td colspan="15" class="header-value text-bold" style="font-size: 8px; border-right: none !important;"> Inspection Date: </td>
						<td  colspan="10" > ${data.qi.inspection_date || ""} </td>
					</tr>
					<tr style="height: 22px;">
						<td colspan="50" class="header-label">Control plan reference : <span class="header-value text-bold">${data.item.control_plan}</span></td>
						<td colspan="6" class="header-label">Challen Number:</td>
						<td colspan="8" class="header-value">${data.qi.challan_no || ""}</td>
						<td colspan="5"></td>
						<td rowspan="2" colspan="5" class="header-label text-center">Qty:</td>
						<td rowspan="2" colspan="6" class="header-value text-center text-bold" style="border-right: none !important;">${data.qty || ""}</td>
						<td rowspan="2" colspan="7" class="header-label text-center text-bold"> Sample Size: </td>
						<td colspan="7" class="header-label text-center">Diamension</td>
						<td colspan="6" class="header-value text-center"></td>
					</tr>
					<tr style="height: 22px;">
						<td colspan="12" class="header-label">Raw Material/I Grade/Lot No</td>
						<td colspan="10" class="header-value text-center text-bold" style="font-size: 9px;">${data.item.raw_material || ""}</td>
						<td colspan="18" class="header-label text-center">Batch Reference:</td>
						<td colspan="12" class="header-value">${data.qi.batch_no || ""}</td>
						<td colspan="8" class="header-label text-center">Date:</td>
						<td colspan="12" class="header-value text-center" style="border-right: none !important;">${data.qi.challan_date || ""}</td>
						<td colspan="7" class="header-label text-center">Attribute:</td>
						<td colspan="6" class="header-value text-center">100%</td>
					</tr>
				</table>

				<!-- Parameters Section -->
				<table class="inspection-sheet" style="margin-top: -1px;">
					<colgroup>
						${Array(100)
							.fill(0)
							.map(() => '<col style="width: 1%;">')
							.join("")}
					</colgroup>
					<thead>
						<tr>
							<th rowspan="2" colspan="4" style="font-size: 8px;">Sr.no</th>
							<th rowspan="2" colspan="22" style="font-size: 8px;">Parameters</th>
							<th rowspan="2" colspan="12" style="font-size: 8px;">Diamension / Tolerance</th>
							<th rowspan="2" colspan="10" style="font-size: 8px;">Equipment Name and Least count</th>
							<th colspan="23" style="font-size: 8px;">Observation</th>
							
							<th colspan="30" style="font-size: 8px;"></th>
							
						</tr>
						<tr>
							<th colspan="3" style="font-size: 7px;">1</th>
							<th colspan="3" style="font-size: 7px;">2</th>
							<th colspan="3" style="font-size: 7px;">3</th>
							<th colspan="3" style="font-size: 7px;">4</th>
							<th colspan="3" style="font-size: 7px;">5</th>
							<th colspan="8" style="font-size: 8px;">Remark</th>
							<th colspan="3" style="font-size: 7px;">1</th>
							<th colspan="3" style="font-size: 7px;">2</th>
							<th colspan="3" style="font-size: 7px;">3</th>
							<th colspan="3" style="font-size: 7px;">4</th>
							<th colspan="3" style="font-size: 7px;">5</th>
							<th  colspan="15" style="font-size: 8px;">Remark</th>
						</tr>
					</thead>
					<tbody>${render_params(parameters, data.inspections)}</tbody>
				</table>
				
				<!-- Footer Section -->
				<table class="inspection-sheet" style="border-top: none !important;">
					<colgroup>
						${Array(100)
							.fill(0)
							.map(() => '<col style="width: 1%;">')
							.join("")}
					</colgroup>
					<tr>
						<td rowspan="2" colspan="8" class="text-center text-bold" style="font-size: 8px; vertical-align: middle;">VENDOR</td>
						<td colspan="12" style="font-size: 7px; border-bottom: none !important; border-top: none !important;">Signature: <br/> Date: <br/> Name: </td>
						<td  colspan="85" class="header-label" style="border-top: none !important; font-size: 7px;">Decision by VENDOR : ${data.qi.status || ""}</td>
					
					</tr>
					
					<tr>
						<td colspan="12"></td>
						
						<td colspan="85" class="header-label" style="font-size: 7px;">Decision by EXIDE : ${data.qi.status || ""}</td>
						
					</tr>
					<tr>
						<td rowspan="2" colspan="8" class="text-center text-bold" style="font-size: 8px; vertical-align: middle;">EXIDE</td>
						<td colspan="12"></td>
						<td  colspan="65" class="header-label" style="font-size: 7px; border-right: none !important;">Reason for rejection : ${data.qi.rejection_reason || ""}</td>
						
					</tr>
					<tr>
					<td colspan="12" style="font-size: 7px; border-bottom: none !important; border-top: none !important;">Signature: <br/> Date: <br/> Name: </td>
						<td colspan="85" class="header-label" style="font-size: 7px;">Disposition action ( Decision by ETL ) :</td>
						
					</tr>
					
					
				</table>
			</div>`;
	}

	function render_params(parameters, inspections) {
		const qi = inspections && inspections.length ? inspections[0] : null;
		const readings = qi ? qi.readings || [] : [];

		return parameters
			.map((p, i) => {
				const reading_data =
					readings.find((r) => r.specification === p.specification) || {};

				let spec = p.value || "";

				// Logic to show tolerance using min/max values
				const min = flt(p.min_value);
				const max = flt(p.max_value);

				if (min !== 0 || max !== 0) {
					if (min !== 0 && max !== 0) {
						if (min === max) {
							spec = min;
						} else {
							const target = flt((min + max) / 2, 2);
							const tolerance = flt((max - min) / 2, 2);
							spec = `${target} \u00B1 ${tolerance}`;
						}
					} else if (min !== 0) {
						spec = `>= ${min}`;
					} else if (max !== 0) {
						spec = `<= ${max}`;
					}
				}
				const equipment_name = p.parameter_group || "";
				const reading_val = reading_data.reading_1 || "";
				const remark = reading_data.status || (reading_val ? "ok" : "");

				// Map readings to columns 1-5
				const r1 = reading_data.reading_1 || "";
				const r2 = reading_data.reading_2 || "";
				const r3 = reading_data.reading_3 || "";
				const r4 = reading_data.reading_4 || "";
				const r5 = reading_data.reading_5 || "";

				return `
				<tr class="param-row">
					<td colspan="4" class="text-center">${i + 1}</td>
					<td colspan="22" style="font-size: 8.5px;">${p.specification || ""}</td>
					<td colspan="12" class="text-center" style="font-size: 8.5px;">${spec || ""}</td>
					<td colspan="10" class="text-center" style="font-size: 8px;">${equipment_name || ""}</td>
					
					<!-- First set of 5 readings -->
					<td colspan="3" class="text-center" style="font-size: 8.5px;">${r1 || ""}</td>
					<td colspan="3" class="text-center" style="font-size: 8.5px;">${r2 || ""}</td>
					<td colspan="3" class="text-center" style="font-size: 8.5px;">${r3 || ""}</td>
					<td colspan="3" class="text-center" style="font-size: 8.5px;">${r4 || ""}</td>
					<td colspan="3" class="text-center" style="font-size: 8.5px;">${r5 || ""}</td>
					
					<!-- First Remark -->
					<td colspan="8" class="text-center" style="font-size: 8px; text-transform: lowercase;">${remark}</td>
					
					<!-- Second set of 5 readings (Empty as per original image) -->
					<td colspan="3"></td>
					<td colspan="3"></td>
					<td colspan="3"></td>
					<td colspan="3"></td>
					<td colspan="3"></td>
					
					<!-- Second Remark (Empty) -->
					<td colspan="15" style="border-right: none !important;"></td>
				</tr>
			`;
			})
			.join("");
	}
};
