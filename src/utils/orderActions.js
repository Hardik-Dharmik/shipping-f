import { syncInvoiceProduct } from './invoiceValues';

const pickFirstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
};

const toStringValue = (...values) => String(pickFirstValue(...values));
const toBooleanValue = (...values) => Boolean(pickFirstValue(...values));
const toNumberValue = (...values) => {
  const value = Number(pickFirstValue(...values));
  return Number.isFinite(value) ? value : 0;
};

export const toCreateOrderFormPrefill = (order = {}) => {
  const orderData = order?.order_data || {};
  const submittedDetails = orderData.submittedDetails || {};
  const addresses = orderData.addresses || {};
  const pickup =
    submittedDetails.pickupAddress ||
    orderData.pickupAddress ||
    orderData.pickup_address ||
    addresses.pickup ||
    orderData.pickup ||
    {};
  const destination =
    submittedDetails.destinationAddress ||
    orderData.destinationAddress ||
    orderData.destination_address ||
    orderData.deliveryAddress ||
    orderData.delivery_address ||
    addresses.destination ||
    orderData.destination ||
    {};
  const compliance = submittedDetails.compliance || orderData.compliance || {};
  const shipmentValue = orderData.shipmentValue || {};
  const shipmentValueAmount =
    typeof shipmentValue === 'object'
      ? shipmentValue.value
      : shipmentValue;
  const shipmentValueCurrency =
    typeof shipmentValue === 'object'
      ? shipmentValue.currency
      : orderData.orderMeta?.shipmentValueCurrency;
  const rawProducts =
    Array.isArray(submittedDetails.products) && submittedDetails.products.length > 0
      ? submittedDetails.products
      : Array.isArray(orderData.products) && orderData.products.length > 0
        ? orderData.products
    : [
        {
          id: 1,
          name: submittedDetails.productName || orderData.productName || order.product_name || 'Shipment Item',
          currency: shipmentValueCurrency || order.carrier?.currency || 'AED',
          unitPrice: shipmentValueAmount || '',
          invoiceValues: Array.isArray(submittedDetails.invoiceValues)
            ? submittedDetails.invoiceValues
            : Array.isArray(orderData.invoiceValues)
              ? orderData.invoiceValues
              : [],
        },
      ];

  const products = rawProducts.map((product, index) =>
    syncInvoiceProduct({
      id: Number(product?.id) || index + 1,
      name: toStringValue(
        product?.name,
        product?.productName,
        submittedDetails.productName,
        orderData.productName,
        order.product_name
      ),
      currency: toStringValue(
        product?.currency,
        shipmentValueCurrency,
        submittedDetails.orderMeta?.shipmentValueCurrency,
        order.carrier?.currency,
        'AED'
      ),
      unitPrice: toStringValue(product?.unitPrice, product?.invoiceValue, shipmentValueAmount),
      invoiceValues: Array.isArray(product?.invoiceValues)
        ? product.invoiceValues
        : Array.isArray(product?.invoice_values)
          ? product.invoice_values
          : [],
    })
  );

  const rawBoxes =
    Array.isArray(submittedDetails.packages) && submittedDetails.packages.length > 0
      ? submittedDetails.packages
      : Array.isArray(orderData.packages) && orderData.packages.length > 0
        ? orderData.packages
      : Array.isArray(orderData.boxes) && orderData.boxes.length > 0
        ? orderData.boxes
        : [];

  const packages = rawBoxes.length > 0
    ? rawBoxes.map((box, index) => ({
        id: Number(box?.id) || index + 1,
        actualWeight: toStringValue(
          box?.actualWeight,
          box?.weight,
          submittedDetails.actualWeight,
          orderData.weight?.declared,
          orderData.weight?.chargeable
        ),
        length: toStringValue(box?.dimensions?.length, box?.length),
        breadth: toStringValue(box?.dimensions?.breadth, box?.breadth),
        height: toStringValue(box?.dimensions?.height, box?.height),
      }))
    : [
        {
          id: 1,
          actualWeight: toStringValue(submittedDetails.actualWeight, orderData.weight?.declared, orderData.weight?.chargeable),
          length: '',
          breadth: '',
          height: '',
        },
      ];

  return {
    formData: {
      pickupCompanyName: toStringValue(
        pickup.companyName,
        pickup.company_name,
        submittedDetails.pickupCompanyName,
        orderData.pickupAddress?.companyName,
        orderData.pickupCompanyName,
        order.pickup_company_name
      ),
      pickupCountry: toStringValue(pickup.country, submittedDetails.pickupCountry, orderData.pickupCountry, order.pickup_country),
      pickupPincode: toStringValue(pickup.pincode, pickup.postalCode, submittedDetails.pickupPincode, orderData.pickupPincode, order.pickup_pincode),
      pickupMobileNo: toStringValue(pickup.mobileNo, pickup.mobile_no, submittedDetails.pickupMobileNo, orderData.pickupMobileNo, order.pickup_mobile_no),
      pickupFullName: toStringValue(pickup.fullName, pickup.full_name, submittedDetails.pickupFullName, orderData.pickupFullName, order.pickup_full_name),
      pickupCompleteAddress: toStringValue(
        pickup.completeAddress,
        pickup.complete_address,
        submittedDetails.pickupCompleteAddress,
        orderData.pickupAddress?.completeAddress,
        orderData.pickupCompleteAddress,
        order.pickup_complete_address
      ),
      pickupLandmark: toStringValue(pickup.landmark, submittedDetails.pickupLandmark, orderData.pickupLandmark, order.pickup_landmark),
      pickupCity: toStringValue(pickup.city, submittedDetails.pickupCity, orderData.pickupCity, order.pickup_city),
      pickupState: toStringValue(pickup.state, submittedDetails.pickupState, orderData.pickupState, order.pickup_state),
      pickupAlternateNo: toStringValue(pickup.alternateNo, pickup.alternate_no, submittedDetails.pickupAlternateNo, orderData.pickupAlternateNo, order.pickup_alternate_no),
      pickupEmail: toStringValue(pickup.email, submittedDetails.pickupEmail, orderData.pickupEmail, order.pickup_email),
      deliveryCompanyName: toStringValue(
        destination.companyName,
        destination.company_name,
        submittedDetails.deliveryCompanyName,
        orderData.destinationAddress?.companyName,
        orderData.deliveryCompanyName,
        order.delivery_company_name
      ),
      deliveryCountry: toStringValue(destination.country, submittedDetails.destinationCountry, orderData.destinationCountry, order.destination_country),
      deliveryPincode: toStringValue(destination.pincode, destination.postalCode, submittedDetails.destinationPincode, orderData.destinationPincode, order.destination_pincode),
      deliveryMobileNo: toStringValue(destination.mobileNo, destination.mobile_no, submittedDetails.deliveryMobileNo, orderData.deliveryMobileNo, order.delivery_mobile_no),
      deliveryFullName: toStringValue(destination.fullName, destination.full_name, submittedDetails.deliveryFullName, orderData.deliveryFullName, order.delivery_full_name),
      deliveryCompleteAddress: toStringValue(
        destination.completeAddress,
        destination.complete_address,
        submittedDetails.deliveryCompleteAddress,
        orderData.destinationAddress?.completeAddress,
        orderData.deliveryCompleteAddress,
        order.delivery_complete_address
      ),
      deliveryLandmark: toStringValue(destination.landmark, submittedDetails.deliveryLandmark, orderData.deliveryLandmark, order.delivery_landmark),
      deliveryCity: toStringValue(destination.city, submittedDetails.deliveryCity, orderData.deliveryCity, order.delivery_city),
      deliveryState: toStringValue(destination.state, submittedDetails.deliveryState, orderData.deliveryState, order.delivery_state),
      deliveryAlternateNo: toStringValue(destination.alternateNo, destination.alternate_no, submittedDetails.deliveryAlternateNo, orderData.deliveryAlternateNo, order.delivery_alternate_no),
      deliveryEmail: toStringValue(destination.email, submittedDetails.deliveryEmail, orderData.deliveryEmail, order.delivery_email),
    },
    products,
    packages,
    compliance: {
      requireBOE: toBooleanValue(compliance.requireBOE, orderData.requireBOE, order.require_boe),
      requireDO: toBooleanValue(compliance.requireDO, orderData.requireDO, order.require_do),
      exportDeclaration: toBooleanValue(compliance.exportDeclaration, orderData.exportDeclaration, order.export_declaration),
      dutyExemption: toBooleanValue(compliance.dutyExemption, orderData.dutyExemption, order.duty_exemption),
      temporaryExportForRepairAndReturn: toBooleanValue(
        compliance.temporaryExportForRepairAndReturn,
        orderData.temporaryExportForRepairAndReturn,
        order.temporary_export_for_repair_and_return
      ),
    },
  };
};

export const toRebookOrderPayload = (order = {}) => {
  const orderData = order?.order_data || {};
  const submittedDetails = orderData.submittedDetails || {};
  const compliance = submittedDetails.compliance || orderData.compliance || {};
  const shipmentValue = orderData.shipmentValue || {};
  const boxes = Array.isArray(submittedDetails.boxes) && submittedDetails.boxes.length > 0
    ? submittedDetails.boxes.map((box) => ({
        quantity: toNumberValue(box?.quantity, 1) || 1,
        actualWeight: toNumberValue(box?.actualWeight, submittedDetails.actualWeight, orderData.weight?.declared, orderData.weight?.chargeable),
        length: toNumberValue(box?.dimensions?.length, box?.length),
        breadth: toNumberValue(box?.dimensions?.breadth, box?.breadth),
        height: toNumberValue(box?.dimensions?.height, box?.height),
      }))
    : Array.isArray(orderData.boxes)
      ? orderData.boxes.map((box) => ({
        quantity: toNumberValue(box?.quantity, 1) || 1,
        actualWeight: toNumberValue(box?.actualWeight, box?.weight, orderData.weight?.declared, orderData.weight?.chargeable),
        length: toNumberValue(box?.dimensions?.length, box?.length),
        breadth: toNumberValue(box?.dimensions?.breadth, box?.breadth),
        height: toNumberValue(box?.dimensions?.height, box?.height),
      }))
      : [];

  return {
    pickupCountry: toStringValue(submittedDetails.pickupCountry, orderData.pickup?.country, orderData.pickupCountry, order.pickup_country),
    pickupPincode: toStringValue(submittedDetails.pickupPincode, orderData.pickup?.pincode, orderData.pickupPincode, order.pickup_pincode),
    destinationCountry: toStringValue(submittedDetails.destinationCountry, orderData.destination?.country, orderData.destinationCountry, order.destination_country),
    destinationPincode: toStringValue(submittedDetails.destinationPincode, orderData.destination?.pincode, orderData.destinationPincode, order.destination_pincode),
    actualWeight: toNumberValue(submittedDetails.actualWeight, orderData.weight?.chargeable, orderData.weight?.declared),
    boxes,
    shipmentValue: toNumberValue(shipmentValue.value, submittedDetails.shipmentValue, orderData.shipmentValue),
    requireBOE: toBooleanValue(compliance.requireBOE, submittedDetails.requireBOE, orderData.requireBOE, order.require_boe),
    requireDO: toBooleanValue(compliance.requireDO, submittedDetails.requireDO, orderData.requireDO, order.require_do),
    exportDeclaration: toBooleanValue(compliance.exportDeclaration, submittedDetails.exportDeclaration, orderData.exportDeclaration, order.export_declaration),
    dutyExemption: toBooleanValue(compliance.dutyExemption, submittedDetails.dutyExemption, orderData.dutyExemption, order.duty_exemption),
    temporaryExportForRepairAndReturn: toBooleanValue(
      compliance.temporaryExportForRepairAndReturn,
      submittedDetails.temporaryExportForRepairAndReturn,
      orderData.temporaryExportForRepairAndReturn,
      order.temporary_export_for_repair_and_return
    ),
    carrier: {
      name: toStringValue(order.carrier?.name, orderData.carrier?.name),
      cost: toNumberValue(order.carrier?.cost, orderData.carrier?.cost),
      currency: toStringValue(order.carrier?.currency, orderData.carrier?.currency, shipmentValue.currency, 'AED'),
      estimatedDelivery: toStringValue(order.carrier?.estimatedDelivery, orderData.carrier?.estimatedDelivery),
      estimatedDeliveryReadable: toStringValue(
        order.carrier?.estimatedDeliveryReadable,
        orderData.carrier?.estimatedDeliveryReadable
      ),
    },
    compliance: {
      requireBOE: toBooleanValue(compliance.requireBOE, orderData.requireBOE, order.require_boe),
      requireDO: toBooleanValue(compliance.requireDO, orderData.requireDO, order.require_do),
      exportDeclaration: toBooleanValue(compliance.exportDeclaration, orderData.exportDeclaration, order.export_declaration),
      exportDeclarationCharge: toNumberValue(compliance.exportDeclarationCharge, 0),
      dutyExemption: toBooleanValue(compliance.dutyExemption, orderData.dutyExemption, order.duty_exemption),
      temporaryExportForRepairAndReturn: toBooleanValue(
        compliance.temporaryExportForRepairAndReturn,
        orderData.temporaryExportForRepairAndReturn,
        order.temporary_export_for_repair_and_return
      ),
    },
    addressFormId: orderData.addressFormId || null,
  };
};
