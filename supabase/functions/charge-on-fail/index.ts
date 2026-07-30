import { handleSettlementRequest } from '../_shared/settlement-handler.ts';

Deno.serve((request) => handleSettlementRequest(request, 'forfeit'));
