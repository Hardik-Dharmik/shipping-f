const toNumberOrZero = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const toStringOrEmpty = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const toQuantity = (value) => {
  const parsedValue = parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

const toDisplayNumber = (value) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return '';
  }

  return String(Number(parsedValue.toFixed(2)));
};

const getResponseData = (response) => response?.data || response?.boxDetail || response || {};

const getRawBoxes = (payload) => {
  if (Array.isArray(payload?.boxes)) {
    return payload.boxes;
  }

  if (Array.isArray(payload?.details)) {
    return payload.details;
  }

  if (Array.isArray(payload?.details?.boxes)) {
    return payload.details.boxes;
  }

  if (
    payload &&
    (payload.actualWeight !== undefined ||
      payload.length !== undefined ||
      payload.breadth !== undefined ||
      payload.height !== undefined)
  ) {
    return [payload];
  }

  return [];
};

export const normalizeSavedBoxDetail = (response) => {
  const payload = getResponseData(response);
  const rawBoxes = getRawBoxes(payload);

  return {
    id: payload.id || payload._id || payload.user_id || '',
    code: payload.code || payload.boxCode || payload.referenceCode || payload.box_detail_code || '',
    name: payload.name || payload.title || payload.label || '',
    weightUnit: payload.weightUnit || payload.weight_unit || 'kg',
    dimensionUnit: payload.dimensionUnit || payload.dimension_unit || 'cm',
    createdAt: payload.createdAt || payload.created_at || '',
    boxes: rawBoxes.map((box, index) => ({
      id: Number(box?.id) || index + 1,
      quantity: toStringOrEmpty(toQuantity(box?.quantity)),
      actualWeight: toStringOrEmpty(
        box?.actualWeight ?? box?.actual_weight ?? box?.weight ?? ''
      ),
      length: toStringOrEmpty(box?.length ?? box?.dimensions?.length ?? ''),
      breadth: toStringOrEmpty(box?.breadth ?? box?.dimensions?.breadth ?? ''),
      height: toStringOrEmpty(box?.height ?? box?.dimensions?.height ?? ''),
    })),
  };
};

export const normalizeSavedBoxDetailsList = (response) => {
  const payload = getResponseData(response);
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.boxDetails)
        ? payload.boxDetails
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

  return rawList.map((item) => normalizeSavedBoxDetail(item));
};

export const toSavedBoxDetailsPayload = (boxes, weightUnit = 'kg', dimensionUnit = 'cm') => ({
  details: boxes.map((box) => ({
    quantity: toQuantity(box.quantity),
    actualWeight: toNumberOrZero(box.actualWeight),
    length: box.length === '' ? null : toNumberOrZero(box.length),
    breadth: box.breadth === '' ? null : toNumberOrZero(box.breadth),
    height: box.height === '' ? null : toNumberOrZero(box.height),
  })),
  weightUnit,
  dimensionUnit,
});

export const toPackagesFromSavedBoxDetail = (savedBoxDetail) => {
  const packages = [];
  let nextId = 1;
  const weightMultiplier = savedBoxDetail.weightUnit === 'pound' ? 0.453592 : 1;
  const dimensionMultiplier = savedBoxDetail.dimensionUnit === 'inches' ? 2.54 : 1;

  savedBoxDetail.boxes.forEach((box) => {
    const quantity = toQuantity(box.quantity);
    const actualWeight = toDisplayNumber(toNumberOrZero(box.actualWeight) * weightMultiplier);
    const length = toDisplayNumber(toNumberOrZero(box.length) * dimensionMultiplier);
    const breadth = toDisplayNumber(toNumberOrZero(box.breadth) * dimensionMultiplier);
    const height = toDisplayNumber(toNumberOrZero(box.height) * dimensionMultiplier);

    for (let index = 0; index < quantity; index += 1) {
      packages.push({
        id: nextId,
        actualWeight,
        length,
        breadth,
        height,
      });
      nextId += 1;
    }
  });

  return packages.length > 0
    ? packages
    : [{ id: 1, actualWeight: '', length: '', breadth: '', height: '' }];
};
