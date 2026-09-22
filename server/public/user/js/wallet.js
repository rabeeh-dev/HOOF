/**
 * @file wallet.js
 * @description Client-side logic for the wallet page.
 */

document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('txnTypeFilter');
    const txnCards = document.querySelectorAll('.wallet-txn-card');

    if (filterSelect && txnCards.length > 0) {
        filterSelect.addEventListener('change', () => {
            const filterValue = filterSelect.value;

            txnCards.forEach(card => {
                const type = card.getAttribute('data-type');
                if (!filterValue || type === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });

            // Show empty message if all are hidden
            const visibleCards = [...txnCards].filter(c => c.style.display !== 'none');
            const emptyState = document.querySelector('.wallet-empty-state');
            if (visibleCards.length === 0 && !emptyState) {
                // Create a temporary "no results" message
                let noResults = document.getElementById('walletNoResults');
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.id = 'walletNoResults';
                    noResults.className = 'wallet-empty-state';
                    noResults.innerHTML = `
            <i class="fas fa-filter"></i>
            <p>No ${filterValue} transactions</p>
            <span>Try selecting a different filter.</span>
          `;
                    document.getElementById('transactionsList').appendChild(noResults);
                }
            } else {
                const noResults = document.getElementById('walletNoResults');
                if (noResults) noResults.remove();
            }
        });
    }
});
