import {NextRequest} from "next/server";
import {extractQueryParams} from "@/src/app/api/banner/route";
import Prisma from "@/src/lib/prisma";
import {SearchAndSelectReturnType} from "@/src/context/GlobalType.type";


type SelectProductType = {
    search?: string
    limit?: number
}

export async function GET(req: NextRequest) {
    const {limit, search} = extractQueryParams(req.nextUrl.toString()) as SelectProductType;
    try {

        if (!limit || !search) return Response.json({message: "Invalid Query"}, {status: 400})

        const productcount = await Prisma.products.count({})
        const selectdata = await Prisma.products.findMany({
            where: {
                name: {
                    contains: search,
                    mode: "insensitive"
                }

            },
            select: {
                id: true ,
                name: true
            } ,
            take: limit ?? 5
        })


        const returndata: SearchAndSelectReturnType = {
            items: selectdata.map(i => ({label: i.name, value: i.id}))  ,
            hasMore: productcount > limit,
        }

        return Response.json({data: returndata}, {status: 200})


    } catch (error) {
        console.log("Get Select Products", error);
        return Response.json({message: "Error Get Select Products"}, {status: 500});
    }


}