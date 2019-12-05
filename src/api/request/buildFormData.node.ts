import * as FormData from "form-data";

/**
 * Constructs FormData instance from object.
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env.
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
function getFormData(body: {
  [key: string]: any;
  fileName?: any;
  file?: any;
}): FormData {
  const formData = new FormData();

  for (const key of Object.keys(body)) {
    let value = body[key];

    if (Array.isArray(value)) {
      // refactor this
      value.forEach(val => formData.append(key + "[]", val));
    } else if (key === "file") {
      formData.append("file", value, body.fileName);
    } else if (value != null) {
      formData.append(key, value);
    }
  }

  return formData;
}

export default getFormData
