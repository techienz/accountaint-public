CREATE TABLE `akahu_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`akahu_connection_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`institution` text NOT NULL,
	`account_type` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`available_balance` real,
	`last_synced_at` integer,
	`linked_budget_account_id` text,
	`linked_business_id` text,
	`linked_ledger_account_id` text,
	`is_tax_savings` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`akahu_connection_id`) REFERENCES `akahu_connections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_budget_account_id`) REFERENCES `budget_bank_accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`linked_business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `akahu_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bank_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`akahu_account_id` text NOT NULL,
	`akahu_transaction_id` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`balance` real,
	`merchant_name` text,
	`reconciliation_status` text DEFAULT 'unmatched' NOT NULL,
	`matched_journal_entry_id` text,
	`receipt_path` text,
	`receipt_mime` text,
	`receipt_document_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_transactions_akahu_transaction_id_unique` ON `bank_transactions` (`akahu_transaction_id`);--> statement-breakpoint
CREATE TABLE `asset_depreciation` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`opening_book_value` real NOT NULL,
	`depreciation_amount` real NOT NULL,
	`closing_book_value` real NOT NULL,
	`depreciation_recovered` real,
	`loss_on_sale` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`purchase_date` text NOT NULL,
	`cost` real NOT NULL,
	`depreciation_method` text NOT NULL,
	`depreciation_rate` real NOT NULL,
	`is_low_value` integer DEFAULT false NOT NULL,
	`disposed` integer DEFAULT false NOT NULL,
	`disposal_date` text,
	`disposal_price` real,
	`notes` text,
	`receipt_path` text,
	`receipt_mime` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`institution` text,
	`account_type` text DEFAULT 'everyday' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_updated` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_config` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pay_frequency` text DEFAULT 'fortnightly' NOT NULL,
	`pay_anchor_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_debts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`balance` real NOT NULL,
	`monthly_repayment` real NOT NULL,
	`interest_rate` real NOT NULL,
	`is_mortgage` integer DEFAULT false NOT NULL,
	`is_credit_card` integer DEFAULT false NOT NULL,
	`credit_limit` real,
	`property_value` real,
	`start_date` text,
	`end_date` text,
	`minimum_payment` real,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_holiday_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`holiday_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`file_path` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`holiday_id`) REFERENCES `budget_holidays`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`savings_goal_id` text,
	`destination` text NOT NULL,
	`date` text,
	`year` integer,
	`accommodation_cost` real DEFAULT 0 NOT NULL,
	`travel_cost` real DEFAULT 0 NOT NULL,
	`spending_budget` real DEFAULT 0 NOT NULL,
	`other_costs` real DEFAULT 0 NOT NULL,
	`trip_type` text DEFAULT 'domestic' NOT NULL,
	`notes` text,
	`custom_fields` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`savings_goal_id`) REFERENCES `budget_savings_goals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `budget_incomes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`monthly_amount` real NOT NULL,
	`work_contract_id` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_contract_id`) REFERENCES `work_contracts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `budget_investment_value_history` (
	`id` text PRIMARY KEY NOT NULL,
	`investment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` real NOT NULL,
	`nzd_rate` real DEFAULT 1 NOT NULL,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `budget_investments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_investments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`platform` text,
	`units` real,
	`cost_basis` real NOT NULL,
	`current_value` real NOT NULL,
	`currency` text DEFAULT 'NZD' NOT NULL,
	`nzd_rate` real DEFAULT 1 NOT NULL,
	`purchase_date` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_one_off_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`notes` text,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `budget_recurring_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`notes` text,
	`monthly_amount` real NOT NULL,
	`due_day` integer,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`is_debt` integer DEFAULT false NOT NULL,
	`debt_principal_portion` real,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `budget_savings_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`target_amount` real,
	`fortnightly_contribution` real DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bank_account_id` text,
	`category_id` text,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`balance` real,
	`type` text NOT NULL,
	`dedup_hash` text NOT NULL,
	`is_categorised` integer DEFAULT false NOT NULL,
	`notes` text,
	`import_batch` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bank_account_id`) REFERENCES `budget_bank_accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`entity_type` text NOT NULL,
	`ird_number` text,
	`balance_date` text DEFAULT '03-31' NOT NULL,
	`gst_registered` integer DEFAULT false NOT NULL,
	`gst_filing_period` text,
	`gst_basis` text,
	`provisional_tax_method` text,
	`has_employees` integer DEFAULT false NOT NULL,
	`paye_frequency` text,
	`invoice_prefix` text DEFAULT 'INV',
	`bill_prefix` text DEFAULT 'BILL',
	`next_invoice_number` integer DEFAULT 1 NOT NULL,
	`next_bill_number` integer DEFAULT 1 NOT NULL,
	`payment_instructions` text,
	`invoice_logo_path` text,
	`invoice_custom_footer` text,
	`invoice_show_branding` integer DEFAULT true NOT NULL,
	`nzbn` text,
	`company_number` text,
	`registered_office` text,
	`incorporation_date` text,
	`fbt_registered` integer DEFAULT false NOT NULL,
	`pays_contractors` integer DEFAULT false NOT NULL,
	`next_resolution_number` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `acc_config` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`cu_code` text,
	`cu_description` text,
	`liable_earnings` real NOT NULL,
	`levy_rate` real NOT NULL,
	`estimated_levy` real NOT NULL,
	`actual_levy` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fbt_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`quarter` integer NOT NULL,
	`benefits_json` text NOT NULL,
	`total_taxable_value` real DEFAULT 0 NOT NULL,
	`fbt_payable` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `home_office_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`method` text NOT NULL,
	`office_area_sqm` real NOT NULL,
	`total_area_sqm` real NOT NULL,
	`costs_json` text NOT NULL,
	`total_claim` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicle_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`method` text NOT NULL,
	`total_business_km` real,
	`mileage_rate` real,
	`business_use_percentage` real,
	`actual_costs_json` text,
	`total_claim` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicle_logbook_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`vehicle_claim_id` text NOT NULL,
	`date` text NOT NULL,
	`from_location` text NOT NULL,
	`to_location` text NOT NULL,
	`km` real NOT NULL,
	`purpose` text,
	`is_business` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_claim_id`) REFERENCES `vehicle_claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`sanitised_content` text,
	`attachments` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`tax_number` text,
	`type` text DEFAULT 'customer' NOT NULL,
	`default_due_days` integer DEFAULT 20 NOT NULL,
	`cc_emails` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`provider` text NOT NULL,
	`service_name` text NOT NULL,
	`category` text NOT NULL,
	`cost` real NOT NULL,
	`billing_cycle` text NOT NULL,
	`start_date` text NOT NULL,
	`term_months` integer,
	`renewal_date` text,
	`auto_renew` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`renewal_notified_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `anomalies` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`change_report_id` text,
	`severity` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`suggested_question` text,
	`status` text DEFAULT 'new' NOT NULL,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `change_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`from_snapshot_id` text NOT NULL,
	`to_snapshot_id` text NOT NULL,
	`changes_json` text NOT NULL,
	`change_count` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_snapshot_id`) REFERENCES `xero_snapshots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_snapshot_id`) REFERENCES `xero_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `xero_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`data` text NOT NULL,
	`data_hash` text NOT NULL,
	`synced_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dividend_declarations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`resolution_number` text NOT NULL,
	`date` text NOT NULL,
	`tax_year` text NOT NULL,
	`total_amount` real NOT NULL,
	`solvency_confirmed` integer DEFAULT true NOT NULL,
	`document_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `document_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`is_system` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`folder_id` text,
	`name` text NOT NULL,
	`description` text,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`document_type` text DEFAULT 'other' NOT NULL,
	`tax_year` text,
	`linked_entity_type` text,
	`linked_entity_id` text,
	`extracted_text` text,
	`extraction_status` text DEFAULT 'pending' NOT NULL,
	`page_count` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `document_folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`job_title` text,
	`department` text,
	`ird_number` text,
	`date_of_birth` text,
	`address` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`employment_type` text NOT NULL,
	`pay_type` text NOT NULL,
	`pay_rate` real NOT NULL,
	`hours_per_week` real DEFAULT 40 NOT NULL,
	`tax_code` text DEFAULT 'M' NOT NULL,
	`kiwisaver_enrolled` integer DEFAULT true NOT NULL,
	`kiwisaver_employee_rate` real DEFAULT 0.035 NOT NULL,
	`kiwisaver_employer_rate` real DEFAULT 0.035 NOT NULL,
	`has_student_loan` integer DEFAULT false NOT NULL,
	`leave_annual_balance` real DEFAULT 0 NOT NULL,
	`leave_sick_balance` real DEFAULT 0 NOT NULL,
	`leave_annual_accrued_to` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `leave_records` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`business_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`days` real NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`vendor` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`gst_amount` real,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`receipt_path` text,
	`receipt_mime` text,
	`xero_invoice_id` text,
	`ocr_raw` text,
	`linked_asset_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `filing_status` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`filing_type` text NOT NULL,
	`period_key` text NOT NULL,
	`shareholder_id` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`filed_date` text,
	`data_snapshot` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `provisional_tax_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`instalment_number` integer NOT NULL,
	`due_date` text NOT NULL,
	`amount_due` real NOT NULL,
	`amount_paid` real,
	`paid_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `income_tax_prep` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`return_type` text NOT NULL,
	`shareholder_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`data_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personal_income_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`shareholder_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`source_type` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`tax_paid` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_loss_records` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`loss_amount` real NOT NULL,
	`carried_forward` real NOT NULL,
	`continuity_met` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_savings_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`month` text NOT NULL,
	`gst_component` real DEFAULT 0 NOT NULL,
	`income_tax_component` real DEFAULT 0 NOT NULL,
	`total_target` real DEFAULT 0 NOT NULL,
	`actual_set_aside` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`sub_type` text NOT NULL,
	`gst_applicable` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`parent_account_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deadlines` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`due_date` text NOT NULL,
	`tax_year` text,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`notified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `integration_config` (
	`id` text PRIMARY KEY NOT NULL,
	`integration` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`gst_rate` real DEFAULT 0.15 NOT NULL,
	`line_total` real NOT NULL,
	`gst_amount` real NOT NULL,
	`account_code` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`work_contract_id` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`date` text NOT NULL,
	`due_date` text NOT NULL,
	`reference` text,
	`currency_code` text DEFAULT 'NZD' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`gst_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`amount_due` real DEFAULT 0 NOT NULL,
	`gst_inclusive` integer DEFAULT false NOT NULL,
	`notes` text,
	`payment_instructions` text,
	`overdue_notified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`entry_number` integer NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`is_posted` integer DEFAULT true NOT NULL,
	`is_reversed` integer DEFAULT false NOT NULL,
	`reversal_of_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`debit` real DEFAULT 0 NOT NULL,
	`credit` real DEFAULT 0 NOT NULL,
	`description` text,
	`gst_amount` real,
	`gst_rate` real,
	`contact_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_items` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`type` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`channel` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`detail_level` text DEFAULT 'vague' NOT NULL,
	`config` text,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pay_run_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`pay_run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`hours` real,
	`pay_rate` real NOT NULL,
	`gross_pay` real NOT NULL,
	`paye` real NOT NULL,
	`kiwisaver_employee` real DEFAULT 0 NOT NULL,
	`kiwisaver_employer` real DEFAULT 0 NOT NULL,
	`esct` real DEFAULT 0 NOT NULL,
	`student_loan` real DEFAULT 0 NOT NULL,
	`net_pay` real NOT NULL,
	`tax_code` text NOT NULL,
	`kiwisaver_employee_rate` real,
	`kiwisaver_employer_rate` real,
	FOREIGN KEY (`pay_run_id`) REFERENCES `pay_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pay_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`pay_date` text NOT NULL,
	`frequency` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`journal_entry_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`finalised_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`business_id` text NOT NULL,
	`date` text NOT NULL,
	`amount` real NOT NULL,
	`method` text DEFAULT 'bank_transfer' NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`keys_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reconciliation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`match_pattern` text NOT NULL,
	`account_id` text NOT NULL,
	`description_template` text NOT NULL,
	`gst_inclusive` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regulatory_check_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tax_year` integer NOT NULL,
	`status` text NOT NULL,
	`areas_checked` integer DEFAULT 0 NOT NULL,
	`areas_changed` integer DEFAULT 0 NOT NULL,
	`areas_uncertain` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `regulatory_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`tax_year` integer NOT NULL,
	`area` text NOT NULL,
	`current_value` text NOT NULL,
	`verified_value` text,
	`status` text NOT NULL,
	`source_url` text,
	`notes` text,
	`applied` integer DEFAULT false NOT NULL,
	`checked_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `regulatory_check_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shareholder_salary_config` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`shareholder_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`salary_amount` real DEFAULT 0 NOT NULL,
	`dividend_amount` real DEFAULT 0 NOT NULL,
	`imputation_credits` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shareholder_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`shareholder_id` text NOT NULL,
	`tax_year` text NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`dividend_declaration_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dividend_declaration_id`) REFERENCES `dividend_declarations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `shareholders` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`ird_number` text,
	`date_of_birth` text,
	`address` text,
	`ownership_percentage` real NOT NULL,
	`is_director` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_optimisation_results` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tax_year` integer NOT NULL,
	`snapshot` text NOT NULL,
	`recommendations` text NOT NULL,
	`total_potential_saving` real NOT NULL,
	`opportunity_count` integer NOT NULL,
	`scanned_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timesheet_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`work_contract_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`duration_minutes` integer NOT NULL,
	`description` text,
	`billable` integer DEFAULT true NOT NULL,
	`hourly_rate` real,
	`status` text DEFAULT 'draft' NOT NULL,
	`invoice_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_contract_id`) REFERENCES `work_contracts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`active_business_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `work_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`client_name` text NOT NULL,
	`contract_type` text NOT NULL,
	`hourly_rate` real,
	`weekly_hours` real,
	`fixed_price` real,
	`retainer_amount` real,
	`retainer_hours` real,
	`start_date` text NOT NULL,
	`end_date` text,
	`wt_rate` real DEFAULT 0 NOT NULL,
	`document_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`expiry_notified_at` integer,
	`project_name` text,
	`project_code` text,
	`billing_cycle` text,
	`invoice_due_day` integer,
	`invoice_send_day` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `xero_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`data` text NOT NULL,
	`synced_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `xero_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`tenant_name` text,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expires_at` integer NOT NULL,
	`scopes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xero_connections_business_id_unique` ON `xero_connections` (`business_id`);