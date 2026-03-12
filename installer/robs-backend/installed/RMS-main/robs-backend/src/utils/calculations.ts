import prismaDefault from './database';

export async function calculateOrderTotal(orderId: string, prismaOverride?: any) {
    const prisma = prismaOverride || prismaDefault;

    // Get settings for tax rate
    const settings = await prisma.settings.findFirst();
    const taxRate = settings?.taxEnabled ? Number(settings.taxRate) : 0;

    // Get order with items
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: {
                include: {
                    menuItem: true,
                },
            },
        },
    });

    if (!order) return 0;

    // Calculate gross total including modifiers
    const grossTotal = order.orderItems.reduce((sum, item) => {
        let itemPrice = Number(item.menuItem.price);

        // Process modifiers if they exist
        if (item.modifiers && Array.isArray(item.modifiers)) {
            (item.modifiers as any).forEach((m: any) => {
                itemPrice += Number(m.price || 0);
            });
        }

        // Round item price to 2 decimals before multiplying
        itemPrice = Math.round(itemPrice * 100) / 100;

        const lineTotal = itemPrice * item.quantity;
        return sum + lineTotal;
    }, 0);
    // Round gross total
    // Apply discount
    let afterDiscount = grossTotal;
    if (order.discountType === 'percentage' && order.discountValue) {
        afterDiscount = grossTotal * (1 - Number(order.discountValue) / 100);
    } else if (order.discountType === 'amount' && order.discountValue) {
        afterDiscount = Math.max(0, grossTotal - Number(order.discountValue));
    }

    // Apply Tax
    const tax = afterDiscount * (taxRate / 100);
    const finalTotal = afterDiscount + tax;

    // Round to 2 decimal places to avoid floating point issues
    return Math.round(finalTotal * 100) / 100;
}
