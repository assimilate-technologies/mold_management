frappe.pages["in-process-inspectio"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "In Process Inspection Report",
		single_column: true,
	});

	const route_options = frappe.route_options;
	const reference_name = route_options ? route_options.reference_name : "";
	const route_template = route_options ? route_options.quality_inspection_template : "";
	frappe.route_options = null; // Clear it after reading

	$(`
		<div class="row mb-4 no-print">
			<div class="col-md-4">
				<div id="reference_filter"></div>
			</div>
			<div class="col-md-4">
				<div id="template_filter"></div>
			</div>
			<div class="col-md-4 d-flex align-items-end">
				<button class="btn btn-primary btn-sm me-2" id="btn-refresh" style="margin-bottom: 2px;"><i class="fa fa-refresh"></i> Refresh</button>
				<button class="btn btn-secondary btn-sm" id="btn-print" style="margin-bottom: 2px;"><i class="fa fa-print"></i> Print</button>
			</div>
		</div>
		
		<div id="report-container" class="report-container">
			<p class="text-center text-muted">Initialize Report...</p>
		</div>

		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
			
			.report-container { background: #f0f2f5; padding: 30px; min-height: 100vh; }
			
			.inspection-sheet-wrapper { 
				background: #fff; 
				padding: 30px; 
				border: 1px solid #ccc; 
				box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
				margin: 0 auto 40px; 
				max-width: 1300px;
				color: #000;
				font-family: 'Inter', sans-serif;
			}
			
			.inspection-sheet { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
			.inspection-sheet th, .inspection-sheet td { 
				border: 1px solid #000; 
				padding: 5px 8px; 
				vertical-align: middle;
			}
			
			.header-label { font-weight: 700; background-color: #f9f9f9; font-size: 10px; color: #333; }
			.header-value { font-size: 11px; }
			
			.logo-cell { padding: 15px !important; }
			.logo-text { font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #000; }
			
			.sheet-title { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
			
			.section-header { 
				font-weight: 700; 
				background-color: #eee; 
				text-align: left !important; 
				padding: 8px 12px !important; 
				font-size: 12px;
				border-top: 2px solid #000 !important;
			}
			
			.table-header th { 
				background: #f4f4f4; 
				font-weight: 700; 
				font-size: 10px; 
				text-transform: uppercase;
				text-align: center;
			}
			
			.param-row td { font-size: 11px; }
			.text-center { text-align: center; }
			.text-bold { font-weight: 700; }
			.status-rejected { color: #d00; font-weight: 700; }
			
			.signature-box { height: 70px; border-top: none !important; }
			
			@media print {
				@page { 
					size: A4 landscape; 
					margin: 5mm; 
				}

				body.custom-report-print { 
					background: #fff !important; 
					margin: 0 !important; 
					padding: 0 !important; 
				}
				
				body.custom-report-print #report-container { 
					width: 100% !important; 
					max-width: 100% !important; 
					margin: 0 !important; 
					padding: 0 !important; 
					background: #fff !important; 
				}

				.inspection-sheet-wrapper { 
					padding: 0; 
					border: none; 
					box-shadow: none; 
					margin: 0; 
					width: 100%;
					max-width: none; 
				}
				
				.page-break { page-break-after: always; }
				
				.inspection-sheet {
					width: 100% !important;
					table-layout: fixed; /* helps with fitting */
					word-wrap: break-word;
				}
				.inspection-sheet th, .inspection-sheet td { 
					border: 1px solid #000 !important; 
					padding: 1px 2px !important; 
					font-size: 7.5px !important;
					line-height: 1 !important;
				}
				.header-label { font-size: 7.5px !important; padding: 1px 2px !important; background-color: #f0f0f0 !important; }
				.header-value { font-size: 8px !important; padding: 1px 2px !important; }
				.logo-text { font-size: 14px !important; font-weight: 800 !important; letter-spacing: 1px !important; margin: 0 !important; }
				.sheet-title { font-size: 12px !important; margin-bottom: 0 !important; }
				.section-header { font-size: 8px !important; padding: 1px 2px !important; }
				.logo-cell { padding: 2px !important; }
				
				/* Compress footer margins */
				.print-footer-note { margin-top: 4px !important; font-size: 7px !important; line-height: 1.1 !important; }
				.print-signature-row { margin-top: 15px !important; }
			}
			
			.hidden-for-print { display: none !important; }
		</style>
	`).appendTo(page.body);

	let template_field;

	const field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#reference_filter"),
		df: {
			label: "Reference (Job Card / DPL / WO)",
			fieldname: "reference_name",
			fieldtype: "Link",
			options: "Job Card",
			default: reference_name,
			onchange: () => {
				const ref = field && typeof field.get_value === "function" ? field.get_value() : "";
				if (ref) {
					frappe.db.get_value("Job Card", ref, "quality_inspection_template")
						.then((r) => {
							if (r && r.message && r.message.quality_inspection_template) {
								if (template_field && typeof template_field.get_value === "function") {
									if (template_field.get_value() !== r.message.quality_inspection_template) {
										template_field.set_value(r.message.quality_inspection_template);
										return;
									}
								}
							}
							load_report_data();
						});
				} else {
					load_report_data();
				}
			},
		},
		render_input: true,
	});

	template_field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#template_filter"),
		df: {
			label: "Quality Inspection Template",
			fieldname: "quality_inspection_template",
			fieldtype: "Link",
			options: "Quality Inspection Template",
			default: route_template,
			get_query: () => {
				return {
					filters: {
						inspection_type: "In Process",
					},
				};
			},
			onchange: () => load_report_data(),
		},
		render_input: true,
	});

	$(wrapper)
		.find("#btn-refresh")
		.on("click", () => load_report_data());
	$(wrapper)
		.find("#btn-print")
		.on("click", () => {
			const $report = $(wrapper).find("#report-container");
			const $placeholder = $('<div id="report-placeholder"></div>').insertAfter($report);
			
			// Move report to body
			$report.appendTo('body');
			
			// Hide everything else in body
			$('body > *').not($report).addClass('hidden-for-print');
			
			// Add a class to body for specific print styles
			$('body').addClass('custom-report-print');
			
			window.print();
			
			// Restore after print dialog closes
			setTimeout(() => {
				$('body > *').removeClass('hidden-for-print');
				$('body').removeClass('custom-report-print');
				$report.insertBefore($placeholder);
				$placeholder.remove();
			}, 500);
		});

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
			const response = await frappe.call({
				method: "mold_management.mold_management.page.in_process_inspectio.in_process_inspectio.get_report_data",
				args: { reference_name: ref, quality_inspection_template: template },
			});

			const data = response.message;
			if (!data || !data.length) {
				$(wrapper)
					.find("#report-container")
					.html(
						'<div class="alert alert-warning text-center">No data found for the selected reference.</div>',
					);
				return;
			}

			// Sync field value if it was a default load
			if (!ref && data[0].job_card && field && typeof field.set_value === "function") {
				field.set_value(data[0].job_card.name);
			}

			if (
				data[0].template_name &&
				template_field &&
				typeof template_field.get_value === "function"
			) {
				if (template_field.get_value() !== data[0].template_name) {
					template_field.set_value(data[0].template_name);
				}
			}

			render_report(data);
		} catch (err) {
			console.error(err);
			$(wrapper)
				.find("#report-container")
				.html(
					'<div class="alert alert-danger">Error fetching report data. Check browser console.</div>',
				);
		}
	}

	function render_report(sheets) {
		const container = $("#report-container").empty();

		sheets.forEach((sheet, idx) => {
			const html = build_sheet_html(sheet);
			container.append(html);
			if (idx < sheets.length - 1) {
				container.append('<div class="page-break"></div>');
			}
		});
	}

	function build_sheet_html(data) {
		const jc = data.job_card;
		const item = data.item;
		const inspections = data.inspections;
		const parameters = data.parameters;
		const operator = data.operator;

		// Column configuration
		const min_empty_cols = Math.max(0, 10 - inspections.length);
		const empty_cols = Array(min_empty_cols).fill({});
		const all_cols = inspections.concat(empty_cols);

		const dynamic_headers_obs = all_cols
			.map((qi, i) => `<th class="text-center">${i + 1}</th>`)
			.join("");
		const dynamic_headers_time = all_cols
			.map((qi) => `<th class="text-center">${qi.time_slot || ""}</th>`)
			.join("");

		let html = `
			<div class="inspection-sheet-wrapper">
				<table class="inspection-sheet">
					<tr>
						<td rowspan="2" class="text-center logo-cell" style="width: 12%;">
							<div class="logo-text">EXIDE</div>
						</td>
						<td colspan="4" rowspan="2" class="text-center" style="width: 50%;">
							<h1 class="sheet-title">FPA/Inprocess Inspection Report</h1>
							<div style="font-size: 11px; margin-top: 5px; color: #555;">${data.template_name || ""}</div>
						</td>
						<td class="header-label" style="width: 120px;">Doc No:</td>
						<td class="header-value">${jc.name}</td>
					</tr>
					<tr>
						<td class="header-label">Rev No & Date:</td>
						<td class="header-value"></td>
					</tr>

					<tr>
						<td class="header-label">Part number :</td><td colspan="2" class="header-value">${jc.production_item}</td>
						<td class="header-label">Part Name :</td><td class="header-value">${item.item_name || ""}</td>
						<td class="header-label">Model :</td><td class="header-value">${item.model || ""}</td>
					</tr>
					<tr>
						<td class="header-label">Control Plan No:</td><td colspan="2" class="header-value">${jc.bom || "YPEW/OP&C/F - 03"}</td>
						<td class="header-label">Machine Number :</td><td class="header-value">${jc.workstation || ""}</td>
						<td class="header-label">Date :</td><td class="header-value">${data.today}</td>
					</tr>
					<tr>
						<td class="header-label">Mold No :</td><td class="header-value">${jc.mould || ""}</td>
						<td class="header-label">Batch No :</td><td class="header-value">${jc.batch_no || ""}</td>
						<td class="header-label">Operator Name : &ensp; ${operator}</td>
						<td class="header-label">Shift :</td><td class="header-value">${jc.shift || ""}</td>
					</tr>
					<tr>
						<td class="header-label">RM & Grade :</td><td colspan="2" class="header-value">${item.raw_material || ""}</td>
						<td class="header-label" colspan="2">MB :</td><td colspan="2" class="header-value">${item.masterbatch || ""}</td>
					</tr>
				</table>

				<table class="inspection-sheet" style="margin-top: -1px;">
					<thead>
						<tr class="table-header">
							<th style="width: 40px;" rowspan="3">Sr.no</th>
							<th style="width: 250px;" rowspan="3">Parameter</th>
							<th style="width: 150px;" rowspan="3">Specification and Tolerance</th>
							<th style="width: 150px;" rowspan="3">Equipment Name and Least count</th>
							<th colspan="${all_cols.length}" class="text-center">Observation</th>
						</tr>
						<tr class="table-header">
							${dynamic_headers_obs}
						</tr>
						<tr class="table-header">
							
							${dynamic_headers_time}
						</tr>
					</thead>
					<tbody>
						${render_parameters_by_group(parameters, inspections, all_cols.length)}
						
					</tbody>
				</table>

				<div class="print-footer-note" style="margin-top: 10px; font-size: 9px; line-height: 1.5; font-weight: bold;">
					Note 1 : In - process frequency is once in a 2 hrs. <br>
					2 : If any visual defects found, it should be written in observation coloumns.
				</div>

				<div class="row print-signature-row" style="margin-top: 30px;">
					<div class="col-6">
						<div style="border-top: 1px solid #000; display: inline-block; min-width: 150px; text-align: center; font-size: 10px; font-weight: bold;">Inspector(QA ENGG)</div>
					</div>
					<div class="col-6 text-right">
						<div style="border-top: 1px solid #000; display: inline-block; min-width: 150px; text-align: center; font-size: 10px; font-weight: bold;">Plant Head</div>
					</div>
				</div>
			</div>
		`;

		return html;
	}

	function render_parameters_by_group(parameters, inspections, total_display_cols) {
		const dimensional = parameters.filter((p) => p.parameter_group === "Dimensional");
		const visual = parameters.filter((p) => p.parameter_group === "Visual");
		const others = parameters.filter(
			(p) => p.parameter_group !== "Dimensional" && p.parameter_group !== "Visual",
		);

		let html = "";

		if (dimensional.length) {
			html += `<tr><td colspan="${total_display_cols + 4}" class="section-header">A. Dimensional Parameters</td></tr>`;
			dimensional.forEach(
				(p, i) =>
					(html += render_parameter_row(p, i + 1, inspections, total_display_cols)),
			);
		}

		if (visual.length) {
			html += `<tr><td colspan="${total_display_cols + 4}" class="section-header">B. Visual Parameters</td></tr>`;
			visual.forEach(
				(p, i) =>
					(html += render_parameter_row(p, i + 1, inspections, total_display_cols)),
			);
		}

		if (others.length && others.length !== parameters.length) {
			html += `<tr><td colspan="${total_display_cols + 4}" class="section-header">C. Other Parameters</td></tr>`;
			others.forEach(
				(p, i) =>
					(html += render_parameter_row(p, i + 1, inspections, total_display_cols)),
			);
		} else if (parameters.length > 0 && dimensional.length === 0 && visual.length === 0) {
			parameters.forEach(
				(p, i) =>
					(html += render_parameter_row(p, i + 1, inspections, total_display_cols)),
			);
		}

		return html;
	}

	function render_parameter_row(p, index, inspections, total_display_cols) {
		let spec_text = "";
		let criteria = (
			p.acceptance_criteria ||
			p.acceptance_criteria_value ||
			p.value ||
			p.tolerance ||
			""
		).trim();
		let range = "";

		if (
			p.numeric ||
			(p.min_value != null &&
				p.max_value != null &&
				p.min_value !== "" &&
				p.max_value !== "")
		) {
			const min_val = parseFloat(p.min_value);
			const max_val = parseFloat(p.max_value);

			if (!isNaN(min_val) && !isNaN(max_val) && (min_val !== 0 || max_val !== 0)) {
				const nom = (min_val + max_val) / 2;
				const tol = (max_val - min_val) / 2;
				if (tol > 0) {
					range = `${nom.toFixed(2)} ± ${tol.toFixed(2)}`;
				} else {
					range = `${p.min_value} - ${p.max_value}`;
				}
			} else if (
				p.min_value != null &&
				p.min_value !== "" &&
				parseFloat(p.min_value) !== 0
			) {
				range = `Min: ${p.min_value}`;
			} else if (
				p.max_value != null &&
				p.max_value !== "" &&
				parseFloat(p.max_value) !== 0
			) {
				range = `Max: ${p.max_value}`;
			}
		}

		// Final decision on Tolerance display
		if (criteria && range && criteria.trim().toLowerCase() !== range.trim().toLowerCase()) {
			spec_text = `${criteria} (${range})`;
		} else {
			spec_text = criteria || range || "-";
		}

		const equipment = `${p.parameter_group || p.equipment || ""}${p.least_count ? " (" + p.least_count + ")" : ""}`;

		let cells = "";
		for (let i = 0; i < total_display_cols; i++) {
			const qi = inspections[i];
			let val = "";
			let style = "";

			if (qi) {
				const paramSpec = (p.specification || "").trim();
				const reading = qi.readings
					? qi.readings.find((r) => (r.specification || "").trim() === paramSpec)
					: null;

				if (reading) {
					// Show BOTH reading_1 and reading_value if both are present and different
					const r1 = reading.reading_1 || "";
					const rv = reading.reading_value || reading.value || "";

					if (r1 && rv && r1.trim().toLowerCase() !== rv.trim().toLowerCase()) {
						val = `${r1} / ${rv}`;
					} else {
						val = r1 || rv || "-";
					}

					if (reading.status === "Rejected") style = "status-rejected";
				} else {
					val = "-";
				}
			}

			cells += `<td class="text-center ${style}">${val}</td>`;
		}

		return `
			<tr class="param-row">
				<td class="text-center">${index.toString().padStart(2, "0")}</td>
				<td>${p.specification}</td>
				<td class="text-center">${spec_text}</td>
				<td class="text-center">${equipment}</td>
				${cells}
			</tr>
		`;
	}
};
