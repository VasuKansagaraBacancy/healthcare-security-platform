-- Run this after:
-- 1. executing supabase/schema.sql
-- 2. creating at least one user through the app or Supabase Auth
--
-- Replace the email below with the user you want to own the demo organization.

do $$
declare
  seed_email text := 'admin@hospital.org';
  seed_user_id uuid;
  seed_org_id uuid;
  dev_mri uuid := gen_random_uuid();
  dev_pacs uuid := gen_random_uuid();
  dev_nurse uuid := gen_random_uuid();
  dev_firewall uuid := gen_random_uuid();
  dev_azure uuid := gen_random_uuid();
  dev_pharmacy uuid := gen_random_uuid();
begin
  select id, organization_id
  into seed_user_id, seed_org_id
  from public.users
  where email = seed_email
  limit 1;

  if seed_user_id is null or seed_org_id is null then
    raise exception 'No user/profile found for %. Register that user first, then rerun this seed.', seed_email;
  end if;

  update public.organizations
  set name = 'St. Aurelia Medical Center'
  where id = seed_org_id;

  delete from public.audit_logs where organization_id = seed_org_id;
  delete from public.user_activity_logs where user_id = seed_user_id;
  delete from public.risk_assessments where organization_id = seed_org_id;
  delete from public.security_alerts where organization_id = seed_org_id;
  delete from public.backup_jobs where organization_id = seed_org_id;
  delete from public.vendors where organization_id = seed_org_id;
  delete from public.training_records where user_id = seed_user_id;
  delete from public.vulnerabilities
  where device_id in (
    select id from public.devices where organization_id = seed_org_id
  );
  delete from public.incidents where organization_id = seed_org_id;
  delete from public.compliance_checks where organization_id = seed_org_id;
  delete from public.devices where organization_id = seed_org_id;

  insert into public.devices (id, name, type, risk_level, organization_id, created_at)
  values
    (dev_mri, 'MRI Scanner Segment A', 'medical_device', 'critical', seed_org_id, now() - interval '18 days'),
    (dev_pacs, 'PACS Imaging Archive', 'server', 'high', seed_org_id, now() - interval '27 days'),
    (dev_nurse, 'Nurse Station WS-14', 'workstation', 'medium', seed_org_id, now() - interval '12 days'),
    (dev_firewall, 'Perimeter Firewall Cluster', 'network', 'high', seed_org_id, now() - interval '34 days'),
    (dev_azure, 'Azure Tenant Clinical Apps', 'cloud_service', 'medium', seed_org_id, now() - interval '41 days'),
    (dev_pharmacy, 'Pharmacy Dispensing App', 'application', 'high', seed_org_id, now() - interval '21 days');

  insert into public.vulnerabilities (title, severity, status, device_id, created_at)
  values
    ('Unsupported firmware detected on MRI controller', 'critical', 'open', dev_mri, now() - interval '10 days'),
    ('Shared local admin credential on imaging archive host', 'high', 'investigating', dev_pacs, now() - interval '8 days'),
    ('Missing EDR agent on nurse station endpoint', 'medium', 'open', dev_nurse, now() - interval '7 days'),
    ('Outdated VPN package on firewall management plane', 'high', 'investigating', dev_firewall, now() - interval '6 days'),
    ('Excessive contributor permissions in cloud subscription', 'medium', 'accepted_risk', dev_azure, now() - interval '14 days'),
    ('Pharmacy app session timeout exceeds policy baseline', 'low', 'remediated', dev_pharmacy, now() - interval '16 days'),
    ('TLS certificate rotation overdue on PACS archive', 'medium', 'open', dev_pacs, now() - interval '5 days'),
    ('Legacy SMB service exposed to clinical VLAN', 'critical', 'open', dev_mri, now() - interval '4 days'),
    ('Firewall rule set contains dormant broad allow rule', 'high', 'open', dev_firewall, now() - interval '3 days'),
    ('Clinical app dependency flagged by vendor advisory', 'medium', 'investigating', dev_pharmacy, now() - interval '2 days');

  insert into public.incidents (
    title,
    description,
    severity,
    status,
    organization_id,
    reported_by,
    owner_user_id,
    created_at
  )
  values
    (
      'Suspicious east-west traffic from imaging subnet',
      'SOC detected abnormal SMB movement between MRI support hosts and the imaging archive. Containment started with VLAN isolation and privileged account review.',
      'critical',
      'investigating',
      seed_org_id,
      seed_user_id,
      seed_user_id,
      now() - interval '30 hours'
    ),
    (
      'Phishing click reported by nursing operations',
      'User reported credential submission to a lookalike M365 page. Password reset complete and sign-in logs under review for unauthorized access.',
      'high',
      'mitigated',
      seed_org_id,
      seed_user_id,
      seed_user_id,
      now() - interval '3 days'
    ),
    (
      'Vendor remote access policy exception review',
      'Legacy remote support tunnel for radiology vendor found enabled outside maintenance window. Access revoked pending approval workflow redesign.',
      'medium',
      'open',
      seed_org_id,
      seed_user_id,
      seed_user_id,
      now() - interval '6 days'
    ),
    (
      'Monthly ransomware readiness tabletop',
      'Scheduled exercise completed with backup restore validation and incident communications drill. Follow-up actions captured for recovery runbook updates.',
      'low',
      'closed',
      seed_org_id,
      seed_user_id,
      seed_user_id,
      now() - interval '11 days'
    );

  insert into public.compliance_checks (name, status, score, organization_id, created_at)
  values
    ('HIPAA 164.308(a)(1)(ii)(A) Risk analysis', 'in_progress', 82, seed_org_id, now() - interval '20 days'),
    ('HIPAA 164.308(a)(5)(ii)(C) Login monitoring', 'compliant', 96, seed_org_id, now() - interval '18 days'),
    ('HIPAA 164.312(a)(2)(i) Unique user identification', 'compliant', 98, seed_org_id, now() - interval '16 days'),
    ('HIPAA 164.312(b) Audit controls', 'at_risk', 68, seed_org_id, now() - interval '14 days'),
    ('HIPAA 164.312(c)(1) Integrity controls', 'in_progress', 79, seed_org_id, now() - interval '12 days'),
    ('HIPAA 164.312(e)(1) Transmission security', 'at_risk', 71, seed_org_id, now() - interval '10 days'),
    ('Third-party vendor access review', 'non_compliant', 54, seed_org_id, now() - interval '8 days'),
    ('Medical device patch governance', 'in_progress', 74, seed_org_id, now() - interval '6 days');

  insert into public.vendors (
    organization_id,
    name,
    risk_level,
    compliance_status,
    contact_email,
    created_at
  )
  values
    (seed_org_id, 'Northbridge Imaging Support', 'critical', 'at_risk', 'security@northbridge-imaging.com', now() - interval '34 days'),
    (seed_org_id, 'Helio Cloud EHR Hosting', 'high', 'in_progress', 'assurance@helio-hosting.com', now() - interval '31 days'),
    (seed_org_id, 'MedCart Pharmacy Robotics', 'medium', 'compliant', 'support@medcart.io', now() - interval '24 days'),
    (seed_org_id, 'Cedar Telehealth Systems', 'medium', 'in_progress', 'privacy@cedartelehealth.com', now() - interval '19 days'),
    (seed_org_id, 'Aegis Revenue Cycle Services', 'low', 'compliant', 'risk@aegis-rcm.com', now() - interval '12 days');

  insert into public.training_records (
    user_id,
    training_name,
    completion_status,
    completion_date,
    created_at
  )
  values
    (seed_user_id, 'Clinical Phishing Defense Essentials', 'completed', current_date - interval '28 days', now() - interval '30 days'),
    (seed_user_id, 'Medical Device Security Handling', 'completed', current_date - interval '21 days', now() - interval '22 days'),
    (seed_user_id, 'HIPAA Incident Escalation Workshop', 'in_progress', null, now() - interval '13 days'),
    (seed_user_id, 'Privileged Access Hygiene for Admins', 'assigned', null, now() - interval '7 days'),
    (seed_user_id, 'Backup Recovery Drill Certification', 'overdue', null, now() - interval '42 days');

  insert into public.backup_jobs (
    organization_id,
    status,
    last_backup_time,
    backup_size,
    created_at
  )
  values
    (seed_org_id, 'success', now() - interval '1 day 2 hours', 842.6, now() - interval '1 day 2 hours'),
    (seed_org_id, 'warning', now() - interval '2 days 1 hour', 836.9, now() - interval '2 days 1 hour'),
    (seed_org_id, 'success', now() - interval '3 days 2 hours', 829.4, now() - interval '3 days 2 hours'),
    (seed_org_id, 'failed', now() - interval '5 days 4 hours', 0, now() - interval '5 days 4 hours'),
    (seed_org_id, 'running', now() - interval '20 minutes', 118.7, now() - interval '20 minutes');

  insert into public.security_alerts (
    organization_id,
    title,
    severity,
    message,
    status,
    created_at
  )
  values
    (
      seed_org_id,
      'Critical vulnerability detected',
      'critical',
      'Two critical findings remain open on imaging infrastructure, including legacy SMB exposure on the MRI controller segment.',
      'open',
      now() - interval '3 hours'
    ),
    (
      seed_org_id,
      'Multiple failed login attempts',
      'high',
      'Identity telemetry shows repeated failed sign-ins against privileged support accounts outside the normal vendor maintenance window.',
      'open',
      now() - interval '8 hours'
    ),
    (
      seed_org_id,
      'High risk device detected',
      'high',
      'Perimeter firewall cluster remains above the defined risk threshold because of outdated VPN software and an overly broad allow rule.',
      'acknowledged',
      now() - interval '1 day 6 hours'
    ),
    (
      seed_org_id,
      'Backup job failure recovered',
      'medium',
      'A failed backup run from earlier this week has been reviewed and the next full execution completed successfully.',
      'resolved',
      now() - interval '3 days'
    );

  insert into public.risk_assessments (
    organization_id,
    risk_score,
    critical_vulnerabilities,
    high_vulnerabilities,
    medium_vulnerabilities,
    open_incidents,
    created_at
  )
  values
    (seed_org_id, 15, 0, 1, 4, 1, now() - interval '42 days'),
    (seed_org_id, 21, 1, 1, 3, 1, now() - interval '35 days'),
    (seed_org_id, 24, 1, 2, 3, 1, now() - interval '28 days'),
    (seed_org_id, 27, 1, 3, 2, 1, now() - interval '21 days'),
    (seed_org_id, 31, 1, 3, 4, 1, now() - interval '14 days'),
    (seed_org_id, 35, 2, 2, 3, 1, now() - interval '10 days'),
    (seed_org_id, 39, 2, 3, 2, 1, now() - interval '6 days'),
    (seed_org_id, 41, 2, 3, 2, 2, now() - interval '2 days');

  insert into public.user_activity_logs (
    user_id,
    action,
    module,
    ip_address,
    created_at
  )
  values
    (seed_user_id, 'login', 'authentication', '10.24.8.15', now() - interval '1 day 3 hours'),
    (seed_user_id, 'device_created', 'devices', '10.24.8.15', now() - interval '18 days'),
    (seed_user_id, 'device_created', 'devices', '10.24.8.15', now() - interval '16 days'),
    (seed_user_id, 'vulnerability_updated', 'vulnerabilities', '10.24.8.15', now() - interval '9 days'),
    (seed_user_id, 'incident_reported', 'incidents', '10.24.8.15', now() - interval '6 days'),
    (seed_user_id, 'compliance_updated', 'compliance', '10.24.8.15', now() - interval '5 days'),
    (seed_user_id, 'report_generated', 'reports', '10.24.8.15', now() - interval '4 days'),
    (seed_user_id, 'vendor_created', 'vendors', '10.24.8.15', now() - interval '3 days 7 hours'),
    (seed_user_id, 'training_assigned', 'training', '10.24.8.15', now() - interval '3 days'),
    (seed_user_id, 'backup_job_created', 'backups', '10.24.8.15', now() - interval '2 days 3 hours'),
    (seed_user_id, 'risk_snapshot_reviewed', 'risk', '10.24.8.15', now() - interval '1 day 6 hours'),
    (seed_user_id, 'logout', 'authentication', '10.24.8.15', now() - interval '20 hours');

  insert into public.audit_logs (user_id, organization_id, action, created_at)
  values
    (seed_user_id, seed_org_id, 'seed_loaded', now() - interval '2 hours'),
    (seed_user_id, seed_org_id, 'device_created:' || dev_mri::text, now() - interval '18 days'),
    (seed_user_id, seed_org_id, 'device_created:' || dev_pacs::text, now() - interval '27 days'),
    (seed_user_id, seed_org_id, 'vulnerability_created:demo-critical-mri', now() - interval '10 days'),
    (seed_user_id, seed_org_id, 'incident_created:imaging-subnet-lateral-movement', now() - interval '30 hours'),
    (seed_user_id, seed_org_id, 'compliance_check_created:audit-controls', now() - interval '14 days');
end $$;
