export const ProductModelMap = {
  "0": "Peak",
  "21": "Peak", // Why another one
  "4294967295": "Peak", // wtf is this puffco
  "1": "Opal",
  "22": "Opal", // Again why another, what happened here?
  "2": "Indiglow",
  "4": "Guardian",
};

export const UserFlags = {
  tester: 1 << 0,
  supporter: 1 << 1,
  admin: 1 << 2,
};

export enum NameDisplay {
  Default, // Uses name field (Discord username/display name) (Puffco account username)
  FirstName, // Shows first name (Only an option if platform is puffco)
  FirstLast, // Shows first + last name (Only an option if platform is puffco)
}

export const EASTER_EGG_CYCLE_COUNTS = [420, 710, 1620, 1910];

export const TEMPERATURE_MAX = 500;
export const TEMPERATURE_MIN = 0;
