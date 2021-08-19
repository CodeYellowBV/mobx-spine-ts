"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelResponseAdapter = void 0;
/**
 * Function which takes the Response or LegacyResponse, and always returns a response
 * @param response
 */
function modelResponseAdapter(response) {
    if (response.with !== undefined) {
        return response;
    }
    return {
        data: response.data,
        with: response.repos || {},
        meta: {},
        with_mapping: response.relMapping || {},
        with_related_name_mapping: response.reverseRelMapping || {},
    };
}
exports.modelResponseAdapter = modelResponseAdapter;
