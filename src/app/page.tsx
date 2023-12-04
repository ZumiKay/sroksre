"use client"

import Banner from "./component/Banner";
import SliderContainer from "./component/Slider";

export default function Home() {
  return (
    <main className="Home__Container w-full grid place-items-center gap-y-10">
      <section className="first_section pt-5 ">
        <Banner title="LOL" />
      </section>
      <section className="second_section w-[95vw] flex flex-row justify-between">
        <Banner title="Men Clothes" width={"30vw"} height="80vh" />
        <Banner title="Women Clothes" width={"30vw"} height="80vh" />
        <Banner title="Women Clothes" width={"30vw"} height="80vh" />
      </section>
      <section className="third_section w-[95vw]">
        <SliderContainer name="New Arrival" />
      </section>
      <section className="fourth_section w-[95vw] flex flex-row justify-between">
        <Banner title="Accessories" width="45vw" height="90vh" />
        <Banner title="Electronic" width="45vw" height="90vh" />
      </section>
      <section className="fith_section">
        <Banner />
      </section>
      
    </main>
  );
}
