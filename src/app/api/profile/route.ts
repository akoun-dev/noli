import { GET as userProfileGET, PUT as userProfilePUT } from "@/app/api/user/profile/route";

/**
 * M-01 : endpoint /api/profile fusionné avec /api/user/profile (l'implémentation
 * unique se trouve dans src/app/api/user/profile/route.ts). Cet alias est
 * conservé pour la rétro-compatibilité des éventuels consommateurs existants.
 */
export { userProfileGET as GET, userProfilePUT as PUT };
