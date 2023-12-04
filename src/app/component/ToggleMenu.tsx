interface toggleprops {
  name: string;
}

export default function ToggleMenu(props: toggleprops) {
  return (
    <div className="toggle__container w-full flex flex-col gap-y-1">
      <h3 className="mb-5 underline font-semibold ">
        {props.name} <i className="ml-2 fa-solid fa-plus bg-black rounded-xl font-black text-white p-1"></i>{" "}
      </h3>
      <div className="detailheader w-full break-words flex flex-col items-start gap-y-3">
          <h3 className="text-base font-semibold"> Materials : sakdlajdjasdasjdjaskljdaklsdsj </h3>
          <h3 className="text-base font-semibold">Manufacture</h3>
          <div className="color__container ">
            <h3 className="text-base font-semibold underline"> Color </h3>
            <div className="color_list flex flex-row items-center gap-x-2 w-full">
              <div className="w-[20px] h-[20px] rounded-xl bg-gray-500"></div>
              <div className="w-[20px] h-[20px] rounded-xl bg-green-500"></div>
              <div className="w-[20px] h-[20px] rounded-xl bg-pink-500"></div>
            </div>
          </div>
          <h3 className="text-base font-semibold"> Okay Kayo brother </h3>
        </div>
       
      
    </div>
  );
}
