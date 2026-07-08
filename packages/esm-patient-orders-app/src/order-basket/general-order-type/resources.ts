import { toOmrsIsoString, type Visit } from '@openmrs/esm-framework';
import {
  type OrderBasketItem,
  priorityOptions,
  type OrderUrgency,
  type OrderPost,
  type OrderableConcept,
  careSettingUuid,
  type PostDataPrepFunction,
} from '@openmrs/esm-patient-common-lib';

export function createEmptyOrder(
  concept: OrderableConcept,
  visit: Visit,
  orderTypeJavaClassName?: string,
): OrderBasketItem {
  return {
    action: 'NEW',
    urgency: priorityOptions[0].value as OrderUrgency,
    display: concept.display,
    concept,
    visit,
    laterality: '',
    orderTypeJavaClassName,
  };
}

export function ordersEqual(order1: OrderBasketItem, order2: OrderBasketItem) {
  return order1.action === order2.action && order1.concept.uuid === order2.concept.uuid;
}

export const prepOrderPostData: PostDataPrepFunction = (
  order,
  patientUuid,
  encounterUuid,
  orderingProviderUuid,
): OrderPost => {
  // Orders whose order type maps to org.openmrs.TestOrder must be posted with the
  // 'testorder' REST subtype, which also supports test-order-specific properties
  // such as laterality.
  const isTestOrder = order.orderTypeJavaClassName === 'org.openmrs.TestOrder';
  const type = isTestOrder ? 'testorder' : 'order';
  const laterality = isTestOrder && order.laterality ? order.laterality : undefined;

  if (order.action === 'NEW' || order.action === 'RENEW') {
    return {
      action: 'NEW',
      type,
      patient: patientUuid,
      careSetting: careSettingUuid,
      orderer: orderingProviderUuid,
      encounter: encounterUuid,
      concept: order.concept.uuid,
      instructions: order.instructions,
      // orderReason: order.orderReason,
      accessionNumber: order.accessionNumber,
      urgency: order.urgency,
      laterality,
      scheduledDate: order.scheduledDate ? toOmrsIsoString(order.scheduledDate) : null,
    };
  } else if (order.action === 'REVISE') {
    return {
      action: 'REVISE',
      type,
      patient: patientUuid,
      careSetting: careSettingUuid,
      orderer: orderingProviderUuid,
      encounter: encounterUuid,
      concept: order?.concept?.uuid,
      instructions: order.instructions,
      previousOrder: order.previousOrder,
      accessionNumber: order.accessionNumber,
      urgency: order.urgency,
      laterality,
      scheduledDate: order.scheduledDate ? toOmrsIsoString(order.scheduledDate) : null,
    };
  } else if (order.action === 'DISCONTINUE') {
    return {
      action: 'DISCONTINUE',
      type,
      patient: patientUuid,
      careSetting: careSettingUuid,
      orderer: orderingProviderUuid,
      encounter: encounterUuid,
      concept: order?.concept?.uuid,
      previousOrder: order.previousOrder,
      accessionNumber: order.accessionNumber,
      urgency: order.urgency,
      scheduledDate: order.scheduledDate ? toOmrsIsoString(order.scheduledDate) : null,
    };
  } else {
    throw new Error(`Unknown order action: ${order.action}.`);
  }
};
