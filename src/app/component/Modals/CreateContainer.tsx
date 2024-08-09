import PrimaryButton, { Selection } from "../Button";
import Modal from "../Modals";

const ContainerType = [
  {
    label: "Slide Show",
    value: "slide",
  },
  {
    label: "Box",
    value: "box",
  },
  {
    label: "Scrollable",
    value: "scrollable",
  },
];

export default function CreateContainerModal() {
  return (
    <Modal closestate="createcontainer">
      <div className="bg-white w-full h-full rounded-lg p-3 flex flex-col items-center">
        <div className="w-full h-fit">
          <label className="text-lg font-bold">Container Type</label>
          <Selection data={ContainerType} name="type" />
        </div>
        <PrimaryButton
          text="Select Banner"
          radius="10px"
          type="button"
          color="#438D86"
          height="100%"
        />
        <div className="btn w-1/2 h-[40px] flex flex-row gap-x-5">
          <PrimaryButton
            text="Create"
            radius="10px"
            type="button"
            color="#438D86"
            height="100%"
          />
          <PrimaryButton
            text="Cancel"
            radius="10px"
            type="button"
            height="100%"
            color="lightcoral"
          />
        </div>
      </div>
    </Modal>
  );
}
