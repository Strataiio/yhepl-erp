-- ============================================================
-- YHEPL ERP — RLS Fix: Master table SELECT policies
-- All authenticated users can read master/lookup tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Master tables need open SELECT for all authenticated staff
-- INSERT/UPDATE restricted to admin roles only

-- ── LOOKUP / REFERENCE TABLES (all staff read) ──

create policy "authenticated read uom_master"
  on uom_master for select to authenticated using (true);

create policy "authenticated read material_grades"
  on material_grades for select to authenticated using (true);

create policy "authenticated read stock_locations"
  on stock_locations for select to authenticated using (true);

create policy "authenticated read shifts"
  on shifts for select to authenticated using (true);

create policy "authenticated read scrap_categories"
  on scrap_categories for select to authenticated using (true);

create policy "authenticated read document_types"
  on document_types for select to authenticated using (true);

create policy "authenticated read nde_coverage_rules"
  on nde_coverage_rules for select to authenticated using (true);

create policy "authenticated read leave_type_master"
  on leave_type_master for select to authenticated using (true);

create policy "authenticated read holiday_calendar"
  on holiday_calendar for select to authenticated using (true);

-- ── OPERATIONAL MASTERS (all staff read) ──

create policy "authenticated read process_types"
  on process_types for select to authenticated using (true);

create policy "authenticated read process_parameter_schemas"
  on process_parameter_schemas for select to authenticated using (true);

create policy "authenticated read process_stations"
  on process_stations for select to authenticated using (true);

create policy "authenticated read process_routes"
  on process_routes for select to authenticated using (true);

create policy "authenticated read route_steps"
  on route_steps for select to authenticated using (true);

create policy "authenticated read product_types"
  on product_types for select to authenticated using (true);

create policy "authenticated read machines"
  on machines for select to authenticated using (true);

create policy "authenticated read cost_rates"
  on cost_rates for select to authenticated using (true);

create policy "authenticated read qc_checkpoints"
  on qc_checkpoints for select to authenticated using (true);

create policy "authenticated read customers"
  on customers for select to authenticated using (true);

create policy "authenticated read vendors"
  on vendors for select to authenticated using (true);

create policy "authenticated read purchase_items"
  on purchase_items for select to authenticated using (true);

create policy "authenticated read wps_library"
  on wps_library for select to authenticated using (true);

create policy "authenticated read itp_templates"
  on itp_templates for select to authenticated using (true);

create policy "authenticated read itp_template_items"
  on itp_template_items for select to authenticated using (true);

create policy "authenticated read departments"
  on departments for select to authenticated using (true);

create policy "authenticated read designations"
  on designations for select to authenticated using (true);

create policy "authenticated read labour_agencies"
  on labour_agencies for select to authenticated using (true);

create policy "authenticated read agency_workers"
  on agency_workers for select to authenticated using (true);

-- ── INSERT/UPDATE for admin roles on masters ──

create policy "admin insert process_types"
  on process_types for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin update process_types"
  on process_types for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert process_stations"
  on process_stations for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin update process_stations"
  on process_stations for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert process_parameter_schemas"
  on process_parameter_schemas for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin delete process_parameter_schemas"
  on process_parameter_schemas for delete to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert material_grades"
  on material_grades for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner','store'));

create policy "admin update material_grades"
  on material_grades for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner','store'));

create policy "admin insert customers"
  on customers for insert to authenticated
  with check (get_my_role() in ('md','project_manager','accounts'));

create policy "admin update customers"
  on customers for update to authenticated
  using (get_my_role() in ('md','project_manager','accounts'));

create policy "admin insert vendors"
  on vendors for insert to authenticated
  with check (get_my_role() in ('md','project_manager','store','accounts'));

create policy "admin update vendors"
  on vendors for update to authenticated
  using (get_my_role() in ('md','project_manager','store','accounts'));

create policy "admin insert machines"
  on machines for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin update machines"
  on machines for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert product_types"
  on product_types for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin update product_types"
  on product_types for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert process_routes"
  on process_routes for insert to authenticated
  with check (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin update process_routes"
  on process_routes for update to authenticated
  using (get_my_role() in ('md','project_manager','project_planner'));

create policy "admin insert cost_rates"
  on cost_rates for insert to authenticated
  with check (get_my_role() in ('md','accounts'));

create policy "admin update cost_rates"
  on cost_rates for update to authenticated
  using (get_my_role() in ('md','accounts'));

create policy "admin insert qc_checkpoints"
  on qc_checkpoints for insert to authenticated
  with check (get_my_role() in ('md','qc_manager','project_planner'));

create policy "admin update qc_checkpoints"
  on qc_checkpoints for update to authenticated
  using (get_my_role() in ('md','qc_manager','project_planner'));

-- Assemblies and project_bom also need read access
create policy "authenticated read assemblies"
  on assemblies for select to authenticated using (true);

create policy "authenticated read project_bom"
  on project_bom for select to authenticated using (true);

create policy "authenticated read project_budgets"
  on project_budgets for select to authenticated using (true);

-- Inventory read
create policy "authenticated read inventory"
  on inventory for select to authenticated using (true);

-- ============================================================
-- DONE — Run this entire block in Supabase SQL Editor
-- ============================================================
