import './styles.css';

class PaymentGateway {
  constructor(options) {
    this.options = options;
    this.modal = null;
    this.handleMessage = this.handleMessage.bind(this);
  }

  open() {
    if (document.getElementById('payment-gateway-modal')) return;

    // Create Modal
    this.modal = document.createElement('div');
    this.modal.id = 'payment-gateway-modal';
    this.modal.setAttribute('data-test-id', 'payment-modal');

    // Inner HTML
    this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button data-test-id="close-modal-button" class="close-button">&times;</button>
          <iframe 
            data-test-id="payment-iframe"
            src="http://localhost:3001/checkout.html?order_id=${this.options.orderId}&embedded=true"
            allow="payment"
          ></iframe>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Event Listeners
    this.modal.querySelector('.close-button').addEventListener('click', () => this.close());
    this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if(e.target.classList.contains('modal-overlay')) this.close();
    });

    window.addEventListener('message', this.handleMessage);
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    window.removeEventListener('message', this.handleMessage);
    if (this.options.onClose) this.options.onClose();
  }

  handleMessage(event) {
    // In production check origin
    // if (event.origin !== 'http://localhost:3001') return;

    const { type, data } = event.data;

    if (type === 'payment_success') {
      if (this.options.onSuccess) this.options.onSuccess(data);
      this.close();
    } else if (type === 'payment_failed') {
      if (this.options.onFailure) this.options.onFailure(data);
    } else if (type === 'close_modal') {
      this.close();
    }
  }
}

export default PaymentGateway;
