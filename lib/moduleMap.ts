export function inferModuleFromPathname(pathname: string) {
  const [firstSegment] = pathname.split("/").filter(Boolean);

  switch (firstSegment) {
    case "dashboard":
      return "dashboard";
    case "devices":
      return "devices";
    case "vulnerabilities":
      return "vulnerabilities";
    case "incidents":
      return "incidents";
    case "compliance":
      return "compliance";
    case "reports":
      return "reports";
    case "risk":
      return "risk";
    case "audit-logs":
      return "audit_logs";
    case "vendors":
      return "vendors";
    case "training":
      return "training";
    case "backups":
      return "backups";
    case "users":
      return "users";
    default:
      return "platform";
  }
}
