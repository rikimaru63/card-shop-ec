import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSelectableCountries } from "@/lib/config/countries";

// 会員登録(signup)・注文(checkout)画面が「選択できる国リスト」を取得するための公開 GET API。
//
// 目的:
//   これまで国リストは src/lib/config/countries.ts のハードコードのみだった。
//   このエンドポイントは DB(ShippingCountry)を単一ソースとして返し、
//   管理画面から国の有効/無効を切り替えられるようにする。
//   ただし DB が空 / 障害でも「国が全部消える」事故を防ぐため、
//   その場合は従来のハードコード(getSelectableCountries)へフォールバックする。
//
// 認証:
//   未ログインの訪問者でも会員登録・注文の前段で国リストが必要になるため「認証不要」。
//   そのため /api/admin 配下ではなく /api/shipping-countries に置く
//   (src/middleware.ts の Basic 認証は /admin と /api/admin のみを対象にしているため対象外)。

// このルートは必ずリクエスト毎に DB を参照する(ビルド時キャッシュ・静的化を無効化)。
export const dynamic = "force-dynamic";

/**
 * region クエリ("US" | "EU")に応じて、選択可能な国の一覧を返す。
 * - DB(ShippingCountry)から取得できればそれを優先(source: "db")。
 * - 0件 or 例外時はハードコードのフォールバックを返す(source: "fallback")。
 */
export async function GET(request: NextRequest) {
  // region の決定順: クエリ ?region → 環境変数 NEXT_PUBLIC_REGION → "US"
  const regionParam = request.nextUrl.searchParams.get("region");
  const region = regionParam || process.env.NEXT_PUBLIC_REGION || "US";

  try {
    // EU 版は enabledEU、それ以外(US 等)は enabledUS を有効判定に使う。
    const countries = await prisma.shippingCountry.findMany({
      where: {
        isActive: true,
        ...(region === "EU" ? { enabledEU: true } : { enabledUS: true }),
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { code: true, name: true },
    });

    // DB に有効な国が1件も無い場合は、国リストが空にならないようフォールバックする。
    if (countries.length === 0) {
      console.warn(
        `[shipping-countries] DB に有効な国が0件のためフォールバックを使用します (region=${region})`
      );
      return NextResponse.json({
        countries: getSelectableCountries(region),
        source: "fallback",
      });
    }

    return NextResponse.json({ countries, source: "db" });
  } catch (error) {
    // DB 障害時も会員登録・注文が止まらないよう、ハードコードの国リストで応答する。
    console.warn(
      `[shipping-countries] DB 取得に失敗したためフォールバックを使用します (region=${region})`,
      error
    );
    return NextResponse.json({
      countries: getSelectableCountries(region),
      source: "fallback",
    });
  }
}
