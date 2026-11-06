"use client";
export const PasswordRequirement = [
  { label: "8 Characters", value: "char" },
  { label: "Contain special character", value: "spec" },
  { label: "Contain number", value: "num" },
];

export const PasswordVerification = ({ password }: { password: string }) => {
  // Function to check if the password meets the requirements
  const validatePassword = (password: string) => ({
    char: password.length >= 8,
    spec: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    num: /\d/.test(password),
  });

  const validationStatus: Record<string, unknown> = validatePassword(password);

  return (
    <div className="password_verification w-full h-fit flex flex-col gap-3 bg-linear-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">
        Password requirements:
      </p>
      <ul className="space-y-2">
        {PasswordRequirement.map((requirement, idx) => {
          const isValid = validationStatus[requirement.value];
          return (
            <li
              key={idx}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${!isValid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
              >
                {isValid ? "✓" : "×"}
              </span>
              <span className={!isValid ? "text-gray-600" : "text-green-700"}>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
