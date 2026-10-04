import {
  DISPOSABLE_PROVIDER_DOMAINS,
  RESERVED_DOMAINS,
  RESERVED_TOP_LEVEL_LABELS,
} from "./disposable-email-domains";

// True when `domain` or any parent domain of it is in `set`, so
// "mail.tempmail.com" matches "tempmail.com".
const matchesDomainOrParent = (domain: string, set: ReadonlySet<string>) => {
  const labels = domain.split(".");
  for (let i = 0; i < labels.length; i += 1) {
    if (set.has(labels.slice(i).join("."))) return true;
  }
  return false;
};

// Never throws: an address that can't be parsed into a domain is
// reported as "not disposable" — rejecting a malformed address is the
// format rule's job, not this one's.
export const isDisposableEmail = (email: string): boolean => {
  const normalised = email.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at === -1) return false;

  const domain = normalised.slice(at + 1).replace(/\.$/, "");
  if (domain === "") return false;

  const topLevelLabel = domain.slice(domain.lastIndexOf(".") + 1);
  if (RESERVED_TOP_LEVEL_LABELS.has(topLevelLabel)) return true;

  return matchesDomainOrParent(domain, RESERVED_DOMAINS)
    || matchesDomainOrParent(domain, DISPOSABLE_PROVIDER_DOMAINS);
};
