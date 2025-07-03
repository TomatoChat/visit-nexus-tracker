SELECT csp."sellerSellingPointCode",
  c."id" AS "supplierId",
  c."name" AS "supplierName",
  ac."addressLine1" AS "supplierAddress",
  ac."city" AS "supplierCity",
  ac."stateProvince" AS "supplierStateProvince",
  ac."postalCode" AS "supplierPostalCode",
  ac."latitude" AS "supplierLatitude",
  ac."longitude" AS "supplierLongitude",
  sp."id" AS "sellerId",
  sp."name" AS "sellerName",
  asp."addressLine1" AS "sellerAddress",
  asp."city" AS "sellerCity",
  asp."stateProvince" AS "sellerStateProvince",
  asp."postalCode" AS "sellerPostalCode",
  asp."latitude" AS "sellerLatitude",
  asp."longitude" AS "sellerLongitude"
  
FROM "companySellingPoint" csp
  LEFT JOIN "companies" c ON c."id" = csp."supplierCompanyId"
  LEFT JOIN "addresses" ac ON ac."id" = c."addressId"
  LEFT JOIN "sellingPoints" sp ON sp."id" = csp."sellingPointId"
  LEFT JOIN "addresses" asp ON asp."id" = sp."addressId"

WHERE csp."sellerSellingPointCode" IS NOT NULL
  AND c."id" IS NOT NULL
  AND sp."id" IS NOT NULL