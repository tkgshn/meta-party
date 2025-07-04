/**
 * usePortfolioValue
 * ユーザーのPT残高（キャッシュ）とポートフォリオ額（現状はキャッシュと同じ）を返すカスタムフック。
 * 将来的に保有シェア・含み益も加味できるよう拡張可能な構造。
 *
 * @returns { portfolioValue: number, cash: number, isLoading: boolean }
 */
import { useState, useEffect } from 'react';
import { usePlayToken } from './usePlayToken';
import { useMetaMask } from './useMetaMask';

export function usePortfolioValue() {
    const { account } = useMetaMask();
    const { balance, isLoading } = usePlayToken(account);

    // 将来的にここで保有シェア・含み益も加算
    const [portfolioValue, setPortfolioValue] = useState<number>(0);

    useEffect(() => {
        if (!isLoading && balance !== undefined) {
            // 今はキャッシュ＝ポートフォリオ
            setPortfolioValue(Number(balance));
        }
    }, [balance, isLoading]);

    return {
        portfolioValue,
        cash: Number(balance),
        isLoading
    };
}
