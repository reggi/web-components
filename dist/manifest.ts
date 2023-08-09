import manifestItem1 from "../server/form-handler.route.ts"
import manifestItem2 from "../server/nested/form-handler-two.route.ts"

export default {
  "/form-handler": manifestItem1,
  "/nested/form-handler-two": manifestItem2,
}
