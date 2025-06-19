import { Allstatus } from "../context/OrderContext";

export function getStatusColor(status?: Allstatus): string {
  switch (status) {
    case Allstatus.paid:
      return "bg-green-100 text-green-800";
    case Allstatus.prepareing:
      return "bg-blue-100 text-blue-800";
    case Allstatus.shipped:
      return "bg-purple-100 text-purple-800";
    case Allstatus.arrived:
      return "bg-emerald-100 text-emerald-800";
    case Allstatus.cancelled:
      return "bg-red-100 text-red-800";
    case Allstatus.problem:
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
