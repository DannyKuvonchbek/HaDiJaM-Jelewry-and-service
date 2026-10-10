// Run with: node scripts/check-order-regressions.cjs
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { ValidationPipe } = require('@nestjs/common');
const { OrderInput, OrderItemUpdate, OrderAdminUpdate } = require('../src/libs/dto/order/order.input.ts');
const { PaymentMethod, PaymentStatus, OrderItemStatus } = require('../src/libs/enums/order.enum.ts');
const { OrderService } = require('../src/components/orders/order.service.ts');
const { OrderResolver } = require('../src/components/orders/order.resolver.ts');
const { ROLES_KEY } = require('../src/components/auth/decorators/roles.decorator.ts');
const { MemberType } = require('../src/libs/enums/member.enum.ts');

async function main() {
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, OrderResolver.prototype.createOrder), [MemberType.USER, MemberType.SELLER, MemberType.ADMIN]);
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const validate = (value, metatype) => pipe.transform(value, { type: 'body', metatype });
  const input = {
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
    deliveryAddress: 'Seoul delivery address',
    deliveryPhone: '+14155552671',
    paymentMethod: Object.values(PaymentMethod)[0],
  };
  assert.equal((await validate(input, OrderInput)).paymentMethod, input.paymentMethod);
  await assert.rejects(validate({ ...input, paymentMethod: 'INVALID' }, OrderInput));
  await assert.rejects(validate({ ...input, items: [{ ...input.items[0], quantity: 0 }] }, OrderInput));
  const itemUpdate = await validate({ _id: 'item', itemStatus: OrderItemStatus.CONFIRMED }, OrderItemUpdate);
  assert.equal(itemUpdate.itemStatus, OrderItemStatus.CONFIRMED);
  const adminUpdate = await validate({ _id: 'order', paymentStatus: PaymentStatus.PENDING }, OrderAdminUpdate);
  assert.equal(adminUpdate.paymentStatus, PaymentStatus.PENDING);

  const id = '507f1f77bcf86cd799439012';
  const items = [{ productImages: ['/uploads/products/item.jpg'] }];
  const document = { _id: id, memberId: 'customer', orderStatus: 'NEW', toObject() { return { _id: id }; } };
  const query = (result) => ({ exec: async () => result });
  const service = new OrderService({
    findOne: () => query(document),
    findByIdAndUpdate: () => query(document),
  }, { find: () => query(items) }, {});
  assert.deepEqual((await service.updateOrder('customer', { _id: id, deliveryAddress: 'Updated address' })).items, items);
  assert.deepEqual((await service.updateOrderByAdmin({ _id: id, paymentStatus: PaymentStatus.PENDING })).items, items);
  const statusItem = { _id: id, orderId: id, sellerId: 'seller', itemStatus: OrderItemStatus.REQUESTED, save: async () => statusItem };
  const statusService = new OrderService({
    findById: () => query({ _id: id, memberId: 'customer' }),
    findByIdAndUpdate: () => query({ _id: id }),
  }, {
    findById: () => query(statusItem),
    find: () => ({ select: () => ({ lean: () => query([statusItem]) }) }),
  }, {});
  await assert.rejects(statusService.updateOrderItem('admin', { _id: id, itemStatus: OrderItemStatus.DELIVERED }, true));
  assert.equal(statusItem.itemStatus, OrderItemStatus.REQUESTED);
  await statusService.updateOrderItem('admin', { _id: id, itemStatus: OrderItemStatus.CONFIRMED }, true);
  assert.equal(statusItem.itemStatus, OrderItemStatus.CONFIRMED);
  console.log('PASS: checkout/status fields survive whitelist, invalid payment/quantity rejected, order update responses include item images.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
