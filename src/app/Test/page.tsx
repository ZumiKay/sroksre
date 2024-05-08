"use client";
import { FormEvent } from "react";

export default function TestForm() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting");
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="form_container">
      <input type="email" name="email" />
      <input
        type="submit"
        value={"signin"}
        onClick={() => console.log("clicked")}
      />
    </form>
  );
}
