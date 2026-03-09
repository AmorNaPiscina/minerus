const form = document.getElementById('orderForm');
const feedback = document.getElementById('feedback');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = '';
    feedback.className = '';

    const data = Object.fromEntries(new FormData(form).entries());
    data.quantity = Number(data.quantity);

    if (data.state !== 'PR') {
      feedback.textContent = 'Desculpe, aceitamos pedidos somente do Paraná (PR).';
      feedback.classList.add('error');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível enviar seu pedido.');
      }

      feedback.textContent = `Pedido #${result.order.id} criado com sucesso. NF pendente no DataCiss.`;
      feedback.classList.add('ok');
      form.reset();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add('error');
    }
  });
}
