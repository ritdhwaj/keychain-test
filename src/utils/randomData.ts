import dayjs from "dayjs";
export function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function generateRandomName(): string {
  const firstName = randomString(6);
  const lastName = randomString(8);
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
}

export function generateRandomFatherName(): string {
  const firstName = randomString(7);
  const lastName = randomString(9);
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
}

export function generateRandomPhone(): string {
  const startDigits = ["6", "7", "8", "9"];
  const firstDigit =
    startDigits[Math.floor(Math.random() * startDigits.length)];
  const remaining = Math.floor(100000000 + Math.random() * 900000000);
  return `${firstDigit}${remaining}`;
}

export function generateRandomEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  const random = Math.floor(Math.random() * 10000);
  return `${cleanName}.${random}@testmail.com`;
}

export function generateUniqueMobileNumber(): string {
  const prefix = "8";
  const timePart = Date.now().toString().slice(-5); // time component
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return prefix + timePart + randomPart;
}

export function getIstStartTime(count: number = 0): Date {
  const now = new Date();

  // -  now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) returns the IST string and new Date wrap stores it in UTC format since the Date object always stores in UTC but returns IST
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  const year = ist.getFullYear();
  const month = ist.getMonth();
  const day = ist.getDate() + count; // ist.getDate internally returns the IST date

  return new Date(Date.UTC(year, month, day, 0, 0, 0));
}
