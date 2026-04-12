export interface YyemsRaw {
  'YYEMS ID': string;
  DateTime: string;
  In_or_out: string;
  'Vendor ID': string;
  Currency: string;
  Amount: number;
  Ownership: string;
  Wallet_owner: string;
  Financial_Accounts: string;
}

export interface VendorRaw {
  ID: string;
  Name: string;
  Vendor_分類: string;
}

export interface AccountRaw {
  ID: string;
  'Display Name': string;
}

export interface YyemsRecord {
  id: string;
  date: Date;
  type: 'In' | 'Out';
  amount: number;
  currency: string;
  owner: string;
  walletOwner: string;
  vendorName: string;
  category: string;
  accountName: string;
  isTransfer: boolean;
}
